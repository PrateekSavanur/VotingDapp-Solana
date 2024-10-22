import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Votingdapp } from '../target/types/votingdapp'
import { BankrunProvider, startAnchor } from 'anchor-bankrun'

const IDL = require("../target/idl/votingdapp.json")

const votingAddress = new PublicKey("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ")

describe('votingdapp', () => {

  let context
  let provider
  let votingProgram: anchor.Program<Votingdapp>

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "votingdapp", programId: votingAddress }], [])

    provider = new BankrunProvider(context)

    votingProgram = new Program<Votingdapp>(IDL, provider)
  })


  it("initialize Poll", async () => {

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1824016135),
      "What is you favorite type of peanut butter"
    ).rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is you favorite type of peanut butter")
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber())
  })

  it("initialize candidate", async () => {

    await votingProgram.methods.initializeCandidate(
      "Ethereum",
      new anchor.BN(1)
    ).rpc()

    await votingProgram.methods.initializeCandidate(
      "Solana",
      new anchor.BN(1)
    ).rpc()

    const [solanaAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Solana")], votingAddress)
    const solanaCandidate = await votingProgram.account.candidate.fetch(solanaAddress)

    const [ethereumAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Ethereum")], votingAddress)
    const ethereumCandidate = await votingProgram.account.candidate.fetch(ethereumAddress)

    expect(ethereumCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(solanaCandidate.candidateVotes.toNumber()).toEqual(0);

  })

  it("vote", async () => {
    await votingProgram.methods.vote("Ethereum", new anchor.BN(1)).rpc()

    const [ethereumAddress] = PublicKey.findProgramAddressSync([new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Ethereum")], votingAddress)
    const ethereumCandidate = await votingProgram.account.candidate.fetch(ethereumAddress)

    expect(ethereumCandidate.candidateVotes.toNumber()).toEqual(1);
  })
})
