#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_register_and_get_owner() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LandRegistryContract);
    let client = LandRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let property_id = String::from_str(&env, "PROP-NYC-10024");

    // Register land
    client.register_land(&owner, &property_id);

    // Verify ownership
    let current_owner = client.get_owner(&property_id);
    assert_eq!(current_owner, owner);

    // Verify parcel metadata
    let parcel = client.get_parcel(&property_id);
    assert_eq!(parcel.owner, owner);
    assert_eq!(parcel.property_id, property_id);
}

#[test]
fn test_transfer_ownership() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LandRegistryContract);
    let client = LandRegistryContractClient::new(&env, &contract_id);

    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let property_id = String::from_str(&env, "PARCEL-TEXAS-409");

    // Register to owner1
    client.register_land(&owner1, &property_id);
    assert_eq!(client.get_owner(&property_id), owner1);

    // Transfer from owner1 to owner2
    client.transfer_ownership(&owner1, &owner2, &property_id);

    // Verify new owner is owner2
    assert_eq!(client.get_owner(&property_id), owner2);
}

#[test]
#[should_panic(expected = "Property ID already registered")]
fn test_duplicate_registration_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, LandRegistryContract);
    let client = LandRegistryContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let property_id = String::from_str(&env, "PROP-DUPLICATE");

    client.register_land(&owner, &property_id);
    client.register_land(&owner, &property_id);
}
