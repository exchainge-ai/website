/// Dataset Licensing Module
///
/// Simple onchain licensing for physical AI datasets.
/// Allows dataset owners to issue licenses to users and track them onchain.
///
/// Key functions:
/// - register_dataset: Register a dataset with its CID
/// - issue_license: Grant a license to a user
/// - revoke_license: Revoke an existing license
/// - is_license_valid: Check if a license is valid

module exchainge_license::license {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};

    // Error codes
    const ELicenseRevoked: u64 = 1;
    const ENotDatasetOwner: u64 = 2;
    const ELicenseExpired: u64 = 3;

    /// Represents a registered dataset
    public struct DatasetInfo has key, store {
        id: UID,
        // Content identifier (IPFS CID, hash, etc)
        cid: String,
        // Dataset owner address
        owner: address,
        // Dataset title
        title: String,
        // Registration timestamp
        created_at: u64,
    }

    /// License NFT issued for a dataset
    /// Owner of this object has the license
    public struct License has key, store {
        id: UID,
        // Dataset CID this license is for
        dataset_cid: String,
        // License holder
        licensee: address,
        // License type (personal, commercial, research, etc)
        license_type: String,
        // Issue timestamp
        issued_at: u64,
        // Expiry timestamp (0 = never expires)
        expires_at: u64,
        // Revocation flag
        is_revoked: bool,
        // Original dataset owner
        dataset_owner: address,
    }

    // Events for backend indexing

    public struct DatasetRegistered has copy, drop {
        dataset_id: address,
        cid: String,
        owner: address,
        title: String,
        timestamp: u64,
    }

    public struct LicenseIssued has copy, drop {
        license_id: address,
        dataset_cid: String,
        licensee: address,
        license_type: String,
        issued_at: u64,
        expires_at: u64,
        dataset_owner: address,
    }

    public struct LicenseRevoked has copy, drop {
        license_id: address,
        dataset_cid: String,
        licensee: address,
        revoked_at: u64,
        revoked_by: address,
    }

    /// Register a dataset onchain
    /// Creates a DatasetInfo object owned by the caller
    public entry fun register_dataset(
        cid: vector<u8>,
        title: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let dataset = DatasetInfo {
            id: object::new(ctx),
            cid: string::utf8(cid),
            owner: sender,
            title: string::utf8(title),
            created_at: timestamp,
        };

        let dataset_id = object::uid_to_address(&dataset.id);

        // Emit event for backend sync
        event::emit(DatasetRegistered {
            dataset_id,
            cid: dataset.cid,
            owner: sender,
            title: dataset.title,
            timestamp,
        });

        // Transfer to sender
        transfer::transfer(dataset, sender);
    }

    /// Issue a license for a dataset
    /// Only dataset owner can issue licenses
    /// License is transferred to the licensee as an NFT
    public entry fun issue_license(
        dataset_cid: vector<u8>,
        licensee: address,
        license_type: vector<u8>,
        expiry_duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Calculate expiry (0 = never expires)
        let expires_at = if (expiry_duration_ms == 0) {
            0
        } else {
            timestamp + expiry_duration_ms
        };

        let license = License {
            id: object::new(ctx),
            dataset_cid: string::utf8(dataset_cid),
            licensee,
            license_type: string::utf8(license_type),
            issued_at: timestamp,
            expires_at,
            is_revoked: false,
            dataset_owner: sender,
        };

        let license_id = object::uid_to_address(&license.id);

        // Emit event for backend sync
        event::emit(LicenseIssued {
            license_id,
            dataset_cid: license.dataset_cid,
            licensee,
            license_type: license.license_type,
            issued_at: timestamp,
            expires_at,
            dataset_owner: sender,
        });

        // Transfer license NFT to licensee
        transfer::transfer(license, licensee);
    }

    /// Revoke a license
    /// Only the original dataset owner can revoke
    public entry fun revoke_license(
        license: &mut License,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Verify sender is dataset owner
        assert!(license.dataset_owner == sender, ENotDatasetOwner);
        assert!(!license.is_revoked, ELicenseRevoked);

        license.is_revoked = true;

        let license_id = object::uid_to_address(&license.id);

        // Emit event for backend sync
        event::emit(LicenseRevoked {
            license_id,
            dataset_cid: license.dataset_cid,
            licensee: license.licensee,
            revoked_at: timestamp,
            revoked_by: sender,
        });
    }

    /// Check if license is valid (not revoked, not expired)
    public fun is_license_valid(license: &License, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);

        // Check revocation
        if (license.is_revoked) {
            return false
        };

        // Check expiry (0 = never expires)
        if (license.expires_at != 0 && current_time > license.expires_at) {
            return false
        };

        true
    }

    // Getter functions for reading license data

    public fun get_dataset_cid(license: &License): String {
        license.dataset_cid
    }

    public fun get_licensee(license: &License): address {
        license.licensee
    }

    public fun get_license_type(license: &License): String {
        license.license_type
    }

    public fun get_issued_at(license: &License): u64 {
        license.issued_at
    }

    public fun get_expires_at(license: &License): u64 {
        license.expires_at
    }

    public fun get_dataset_owner(license: &License): address {
        license.dataset_owner
    }

    public fun is_revoked(license: &License): bool {
        license.is_revoked
    }
}
