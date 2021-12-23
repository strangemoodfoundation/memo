use std::str::from_utf8;

use anchor_lang::prelude::*;
use anchor_spl::token::{Transfer, Token, TokenAccount};

declare_id!("4WfX3TMZ8pv2FgQyLeWabRoJy5GAYAm7tZhkVGVdsUt7");


/**
 * Whoever is calling this must pass in the appropriate token_program
 */
pub fn transfer<'a>(
    token_program: AccountInfo<'a>,
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    amount: u64,
) -> ProgramResult {
    msg!("starting transfer of {}", amount);
    let cpi_program = token_program;
    let cpi_accounts = Transfer {
        from,
        to,
        authority,
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, amount)
}


// In initialize we want to set our memo account authority. We will set authority to the same public key as the keys that signed the transaction.
// BUT, in order for us to have access to authority in initialize() we need:
// 1. MemoAccount must be a created account
// 2. MemoAccount must paid for by someone
// 3. MemoAccount must have enough space allocated to store our data
// 4. initialize must have access to the authority field on MemoAccount
// 5. authority must sign the initialize tranaction request

#[program]
pub mod memo {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>, // <-- Anchor context that holds all the account data (structs) below
        new_bio: Vec<u8>,         // <--- our memo account bio
    ) -> ProgramResult {
        // <--- These functions are snake_case of the CamelCase struct below
        let b_p_a = &mut ctx.accounts.memo_account; // grab a mutable reference to our MemoAccount struct
        b_p_a.authority = *ctx.accounts.authority.key; // set the MemoAccount.authority to the pubkey of the authority
        b_p_a.bio = new_bio.to_vec(); // save the latest bio in the account.
        let bio = from_utf8(&new_bio) // convert the array of bytes into a string slice
            .map_err(|err| {
                msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
                ProgramError::InvalidInstructionData
            })?;
        msg!(bio);
        Ok(()) // return the Result
    }

    pub fn init_and_transfer(
        ctx: Context<InitAndTransfer>,
        new_memo: Vec<u8>, // <--- our memo for the transaction
        // amount: u64,// amount of lamports to transfer
        // token_program: Program<Token>,
    ) -> ProgramResult {
        // msg!("starting memo_transfer of {}", amount);

        let bio = from_utf8(&new_memo) // convert the array of bytes into a string slice
            .map_err(|err| {
                msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
                ProgramError::InvalidInstructionData
            })?;
        msg!("trying something new {}", bio);

        // transfer(ctx.accounts.token_program.to_account_info(), ctx.accounts.authority.to_account_info(), ctx.accounts.transfer_to.to_account_info(), ctx.accounts.authority.to_account_info(),  1 as u64)?;

        Ok(()) // return ok result
    }

    pub fn memo_transfer(
        ctx: Context<UpdateLatestTransaction>,
        new_memo: Vec<u8>, // <--- our memo for the transaction
        // amount: u64,// amount of lamports to transfer
        // token_program: Program<Token>,
    ) -> ProgramResult {
        // msg!("starting memo_transfer of {}", amount);

        let payment_memo = from_utf8(&new_memo) // convert the array of bytes into a string slice
            .map_err(|err| {
                msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
                ProgramError::InvalidInstructionData
            })?;
        
        // transfer(ctx.accounts.token_program.to_account_info(), ctx.accounts.authority.to_account_info(), ctx.accounts.transfer_to.to_account_info(), ctx.accounts.authority.to_account_info(),  amount as u64)?;

        msg!(payment_memo); // msg!() is a Solana macro that prints string slices to the program log, which we can grab from the transaction block data
        // msg!("To: {}", ctx.accounts.transfer_to); // don't need to be logged because.. well.. they occur on chain lmao.
        // msg!("Amount: {}", amount);

        let b_acc = &mut ctx.accounts.memo_account;
        b_acc.latest_memo = new_memo; // save the latest payment in the account.
                                      // past payments will be saved in transaction logs


        Ok(()) // return ok result
    }
    
    pub fn update_bio(
        ctx: Context<UpdateLatestTransaction>,
        new_bio: Vec<u8>, // <--- our memo payment bio
    ) -> ProgramResult {
        let b_acc = &mut ctx.accounts.memo_account;
        b_acc.bio = new_bio; // save the latest bio in the account.
        Ok(()) // return ok result
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, // hey Anchor, initialize an account with these details for me
        payer = authority, // See that authority Signer (pubkey) down there? They're paying for this 
        space = 8 // all accounts need 8 bytes for the account discriminator prepended to the account
        + 32 // authority: Pubkey needs 32 bytes
        + 566 // latest_memo: payment bytes could need up to 566 bytes for the memo
        + 256 // bytes of meta data (name, about, link.in.bio, etc)
        // You have to do this math yourself, there's no macro for this
    )]
    pub memo_account: Account<'info, MemoAccount>, // <--- initialize this account variable & add it to Context and can be used above ^^ in our initialize function
    #[account(mut)]
    pub authority: Signer<'info>, // <--- let's name the account that signs this transaction "authority" and make it mutable so we can set the value to it in `initialize` function above
    pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}

// trying something here...
#[derive(Accounts)]
pub struct InitAndTransfer<'info> {
    #[account(
        init, // hey Anchor, initialize an account with these details for me
        payer = authority, // See that authority Signer (pubkey) down there? They're paying for this 
        space = 8 // all accounts need 8 bytes for the account discriminator prepended to the account
        + 32 // authority: Pubkey needs 32 bytes
        + 566 // latest_memo: payment bytes could need up to 566 bytes for the memo
        + 256 // bytes of meta data (name, about, link.in.bio, etc)
        // You have to do this math yourself, there's no macro for this
    )]
    pub memo_account: Account<'info, MemoAccount>, // <--- initialize this account variable & add it to Context and can be used above ^^ in our initialize function
    pub token_program: Program<'info, Token>,
     #[account(mut)]
    pub transfer_to: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>, // <--- Anchor boilerplate
    #[account(mut)]
    pub authority: Signer<'info>, // <--- let's name the account that signs this transaction "authority" and make it mutable so we can set the value to it in `initialize` function above
    

}

#[derive(Accounts)]
pub struct UpdateLatestTransaction<'info> {
    #[account(
        mut, // we can make changes to this account
        has_one = authority)] // the authority has signed this payment, allowing it to happen
    // this is here again because it holds that .latest_memo field where our payment is saved
    pub memo_account: Account<'info, MemoAccount>, // <-- enable this account to also be used in the memo_transfer function
    
    pub transfer_to: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,

    // Also put authority here
    // has_one = authority ensure it was provided as a function arg
    // ensures the paymenter has the keys
    // has to come after the Account statement above
    // no mut this time, because we don't change authority when we payment

    pub authority: Signer<'info>,
}

#[account]
pub struct MemoAccount {
    pub authority: Pubkey,    // save the paymenting authority to this authority field
    pub latest_memo: Vec<u8>, // <-- where the latest memo payment will be stored
    pub bio: Vec<u8>,
}