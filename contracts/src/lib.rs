#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LandParcel {
    pub owner: Address,
    pub property_id: String,
    pub registered_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Parcel(String),
}

#[contract]
pub struct LandRegistryContract;

#[contractimpl]
impl LandRegistryContract {
    /// Registers a new land parcel (Property ID) and sets the initial owner.
    /// Requires authorization from `owner`.
    pub fn register_land(env: Env, owner: Address, property_id: String) {
        // Enforce owner authorization
        owner.require_auth();

        let key = DataKey::Parcel(property_id.clone());

        // Check if property ID is already registered
        if env.storage().persistent().has(&key) {
            panic!("Property ID already registered");
        }

        let timestamp = env.ledger().timestamp();
        let parcel = LandParcel {
            owner: owner.clone(),
            property_id: property_id.clone(),
            registered_at: timestamp,
        };

        // Save parcel record in persistent storage
        env.storage().persistent().set(&key, &parcel);

        // Publish event for tracking
        let topics = (symbol_short!("register"), owner.clone());
        env.events().publish(topics, property_id);
    }

    /// Transfers property ownership to a new owner.
    /// Requires authorization from `current_owner`.
    pub fn transfer_ownership(
        env: Env,
        current_owner: Address,
        new_owner: Address,
        property_id: String,
    ) {
        // Enforce current owner authorization
        current_owner.require_auth();

        let key = DataKey::Parcel(property_id.clone());

        // Fetch property record or panic if non-existent
        let mut parcel: LandParcel = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Property ID not found"));

        // Ensure current caller matches recorded owner
        if parcel.owner != current_owner {
            panic!("Caller is not the registered owner");
        }

        // Update ownership record
        parcel.owner = new_owner.clone();
        env.storage().persistent().set(&key, &parcel);

        // Publish transfer event
        let topics = (symbol_short!("transfer"), current_owner, new_owner);
        env.events().publish(topics, property_id);
    }

    /// Read-only function that returns the current owner's address for a Property ID.
    pub fn get_owner(env: Env, property_id: String) -> Address {
        let key = DataKey::Parcel(property_id);
        let parcel: LandParcel = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Property ID not found"));
        parcel.owner
    }

    /// Read-only function that returns complete details of a registered land parcel.
    pub fn get_parcel(env: Env, property_id: String) -> LandParcel {
        let key = DataKey::Parcel(property_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Property ID not found"))
    }
}

#[cfg(test)]
mod test;
