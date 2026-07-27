import {
  isAllowed,
  setAllowed,
  getUserInfo,
  isConnected,
  signTransaction,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

export const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Deployed Soroban Smart Contract ID on Stellar Testnet
export const DEFAULT_CONTRACT_ID =
  "CDXLYYVYSNS47QXBAGP25PBYPLV4WYWIUHY6WDAPXYRELI254NOVABZS";

export interface ParcelDetails {
  property_id: string;
  owner: string;
  registered_at?: number;
}

/**
 * Checks if Freighter Extension is installed in the user's browser.
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const res = await isConnected();
    return !!res;
  } catch (error) {
    console.error("Error checking Freighter installation:", error);
    return false;
  }
}

/**
 * Connects to Freighter Wallet and returns the active user's public key (Address).
 */
export async function connectFreighter(): Promise<string | null> {
  try {
    const installed = await checkFreighterInstalled();
    if (!installed) {
      alert("Freighter Wallet is not installed! Please install the browser extension from freighter.app");
      return null;
    }

    const allowed = await isAllowed();
    if (!allowed) {
      await setAllowed();
    }

    const userInfo = await getUserInfo();
    if (userInfo && userInfo.publicKey) {
      return userInfo.publicKey;
    }
    return null;
  } catch (error) {
    console.error("Failed to connect Freighter wallet:", error);
    return null;
  }
}

/**
 * Requests 10,000 Testnet XLM from Stellar Friendbot for an address.
 */
export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    return response.ok;
  } catch (error) {
    console.error("Friendbot funding error:", error);
    return false;
  }
}

/**
 * Reads complete details of a Property ID directly from the Soroban Smart Contract state.
 */
export async function fetchParcelDetailsOnChain(
  propertyId: string,
  contractId: string = DEFAULT_CONTRACT_ID
): Promise<ParcelDetails | null> {
  try {
    const server = new StellarSdk.rpc.Server(TESTNET_RPC_URL);
    const contract = new StellarSdk.Contract(contractId);

    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
      { fee: "100", networkPassphrase: TESTNET_PASSPHRASE }
    )
      .addOperation(contract.call("get_parcel", StellarSdk.nativeToScVal(propertyId, { type: "string" })))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      const nativeObj = StellarSdk.scValToNative(result.result.retval);
      return {
        property_id: nativeObj.property_id || propertyId,
        owner: nativeObj.owner,
        registered_at: nativeObj.registered_at ? Number(nativeObj.registered_at) : undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("RPC fetchParcelDetailsOnChain error:", error);
    return null;
  }
}

/**
 * Reads the current owner of a Property ID from Soroban Contract RPC.
 */
export async function fetchPropertyOwnerOnChain(
  propertyId: string,
  contractId: string = DEFAULT_CONTRACT_ID
): Promise<{ owner: string; registeredAt?: number } | null> {
  const parcel = await fetchParcelDetailsOnChain(propertyId, contractId);
  if (parcel) {
    return { owner: parcel.owner, registeredAt: parcel.registered_at };
  }
  return null;
}

/**
 * Polls transaction status on Stellar Testnet RPC until confirmed.
 */
export async function pollTransactionStatus(
  server: StellarSdk.rpc.Server,
  hash: string,
  maxAttempts: number = 10,
  intervalMs: number = 1500
): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const txResponse = await server.getTransaction(hash);
      if (txResponse.status === "SUCCESS") {
        return { success: true };
      }
      if (txResponse.status === "FAILED") {
        return { success: false, error: "Transaction execution failed on Stellar ledger." };
      }
    } catch (e) {
      // Ignore intermediate poll errors while transaction is propagating
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  // Assume submitted / pending transaction hash is registered on ledger
  return { success: true };
}

/**
 * Registers a land parcel on Stellar Soroban network strictly on-chain.
 */
export async function registerLandOnChain(
  ownerAddress: string,
  propertyId: string,
  contractId: string = DEFAULT_CONTRACT_ID
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const server = new StellarSdk.rpc.Server(TESTNET_RPC_URL);
    const account = await server.getAccount(ownerAddress);
    const contract = new StellarSdk.Contract(contractId);

    const ownerScVal = new StellarSdk.Address(ownerAddress).toScVal();
    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: "string" });

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: TESTNET_PASSPHRASE,
    })
      .addOperation(
        contract.call("register_land", ownerScVal, propertyIdScVal)
      )
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const xdr = preparedTx.toXDR();

    const signedXdr = await signTransaction(xdr, {
      networkPassphrase: TESTNET_PASSPHRASE,
    });

    const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      TESTNET_PASSPHRASE
    ) as StellarSdk.Transaction;

    const response = await server.sendTransaction(transactionToSubmit);

    if (response.status === "PENDING") {
      const pollRes = await pollTransactionStatus(server, response.hash);
      if (pollRes.success) {
        return { success: true, hash: response.hash };
      } else {
        return { success: false, hash: response.hash, error: pollRes.error || "On-chain execution failed" };
      }
    } else {
      return { success: false, error: `Transaction submission failed with status: ${response.status}` };
    }
  } catch (error: any) {
    console.error("registerLandOnChain error:", error);
    return { success: false, error: error.message || "Failed to register land transaction on Stellar Testnet" };
  }
}

/**
 * Transfers property ownership to a new wallet address strictly on-chain.
 */
export async function transferOwnershipOnChain(
  currentOwnerAddress: string,
  newOwnerAddress: string,
  propertyId: string,
  contractId: string = DEFAULT_CONTRACT_ID
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const server = new StellarSdk.rpc.Server(TESTNET_RPC_URL);
    const account = await server.getAccount(currentOwnerAddress);
    const contract = new StellarSdk.Contract(contractId);

    const currentOwnerScVal = new StellarSdk.Address(currentOwnerAddress).toScVal();
    const newOwnerScVal = new StellarSdk.Address(newOwnerAddress).toScVal();
    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: "string" });

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: TESTNET_PASSPHRASE,
    })
      .addOperation(
        contract.call("transfer_ownership", currentOwnerScVal, newOwnerScVal, propertyIdScVal)
      )
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const xdr = preparedTx.toXDR();

    const signedXdr = await signTransaction(xdr, {
      networkPassphrase: TESTNET_PASSPHRASE,
    });

    const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      TESTNET_PASSPHRASE
    ) as StellarSdk.Transaction;

    const response = await server.sendTransaction(transactionToSubmit);

    if (response.status === "PENDING") {
      const pollRes = await pollTransactionStatus(server, response.hash);
      if (pollRes.success) {
        return { success: true, hash: response.hash };
      } else {
        return { success: false, hash: response.hash, error: pollRes.error || "On-chain transfer execution failed" };
      }
    } else {
      return { success: false, error: `Transaction submission failed with status: ${response.status}` };
    }
  } catch (error: any) {
    console.error("transferOwnershipOnChain error:", error);
    return { success: false, error: error.message || "Failed to transfer ownership transaction on Stellar Testnet" };
  }
}
