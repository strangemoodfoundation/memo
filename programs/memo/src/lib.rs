use std::str::from_utf8;

use anchor_lang::prelude::*;
use solana_program::{
    system_instruction::{transfer}, 
    program::{invoke},
    entrypoint::ProgramResult
};

declare_id!("4WfX3TMZ8pv2FgQyLeWabRoJy5GAYAm7tZhkVGVdsUt7");


pub fn execute_transfer<'a>(from: AccountInfo<'a>, to: AccountInfo<'a>, amount: u64) -> ProgramResult {
    let ix = transfer(from.key, to.key, amount);
    invoke(&ix, &[from.clone(), to.clone()])?;
    Ok(())
}

pub fn add_memo<'a>(new_memo: Vec<u8>, memo_account: &mut Account<MemoAccount>) -> ProgramResult {
    let payment_memo = from_utf8(&new_memo) // convert the array of bytes into a string slice
        .map_err(|err| {
            msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
            ProgramError::InvalidInstructionData
        })?;
        
        // msg!() is a Solana macro that prints string slices to the program log, which we can grab from the transaction block data
    msg!(payment_memo);

    // past payments will be saved in transaction logs
    memo_account.latest_memo = new_memo; // save the latest memo in the account.

    Ok(())
}

#[program]
pub mod memo {
    use super::*;

    pub fn init_and_memo_transfer(
        ctx: Context<InitAndMemoTransfer>,
        _memo_bump: u8, // anchor handles creating the PDA correctly, so we don't use this in the fn but, rest assured, anchor do be doin things.
        new_memo: Vec<u8>, // <--- our memo for the transaction
        amount: u64,// amount of lamports to transfer
    ) -> ProgramResult {
        
        // todo: support creation of a bio! currently setting bio to the first memo note
        let memo_acc = &mut ctx.accounts.memo_account; // grab a mutable reference to our MemoAccount struct
        memo_acc.bio = new_memo.to_vec(); // save a bio in the account.

        add_memo(new_memo, memo_acc)?;
        execute_transfer(ctx.accounts.transfer_from.to_account_info(), ctx.accounts.transfer_to.to_account_info(),  amount)?;

        Ok(()) // return ok result
    }

    pub fn memo_transfer(
        ctx: Context<UpdateLatestTransaction>,
        new_memo: Vec<u8>, // <--- our memo for the transaction
        amount: u64,// amount of lamports to transfer
    ) -> ProgramResult {
        add_memo(new_memo, &mut ctx.accounts.memo_account)?;
        execute_transfer(ctx.accounts.transfer_from.to_account_info(), ctx.accounts.transfer_to.to_account_info(),  amount)?;

        Ok(()) // return ok result
    }
    
    pub fn update_bio(
        ctx: Context<UpdateLatestTransaction>,
        new_bio: Vec<u8>, // <--- our memo payment bio
    ) -> ProgramResult {
        let memo_acc = &mut ctx.accounts.memo_account;
        memo_acc.bio = new_bio; // save the latest bio in the account.
        Ok(()) // return ok result
    }
}

#[derive(Accounts)]
#[instruction(memo_bump: u8)]
pub struct InitAndMemoTransfer<'info> {
    #[account(
        init, // hey Anchor, initialize an account with these details for me
        seeds=[b"memo_message", transfer_from.key().as_ref()],
        bump=memo_bump,
        payer=transfer_from, // See that authority Signer (pubkey) down there? They're paying for this 
        space = 8 // all accounts need 8 bytes for the account discriminator prepended to the account
        + 32 // authority: Pubkey needs 32 bytes
        + 566 // latest_memo: payment bytes could need up to 566 bytes for the memo
        + 256 // bytes of meta data (name, about, link.in.bio, etc)
        // You have to do this math yourself, there's no macro for this
    )]
    pub memo_account: Account<'info, MemoAccount>, // <--- initialize this account variable & add it to Context and can be used above ^^ in our initialize function
    pub system_program: Program<'info, System>, // <--- Anchor boilerplate

    #[account(mut)]
    pub transfer_to: SystemAccount<'info>,
    #[account(mut)]
    pub transfer_from: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct UpdateLatestTransaction<'info> {
    // this is here again because it holds that .latest_memo field where our payment is saved
    #[account(mut)]
    pub memo_account: Account<'info, MemoAccount>, // <-- enable this account to also be used in the memo_transfer function

    pub system_program: Program<'info, System>, // <--- Anchor boilerplate

    #[account(mut)]
    pub transfer_to: SystemAccount<'info>,
    #[account(mut)]
    pub transfer_from: SystemAccount<'info>,
}

#[account]
pub struct MemoAccount {
    pub latest_memo: Vec<u8>, // <-- where the latest memo payment will be stored
    pub bio: Vec<u8>,
}