import {Address, ProviderRpcClient} from 'everscale-inpage-provider';
import {
    EverWalletAccount,
    Clock,
    EverscaleStandaloneClient,
    SimpleAccountsStorage,
    SimpleKeystore
} from 'everscale-standalone-client/nodejs';
import {deriveBip39Phrase, makeBip39Path} from "everscale-crypto";

// @ts-ignore

let keystore = new SimpleKeystore();
let path = makeBip39Path(0);
let keys = deriveBip39Phrase('', path);
keystore.addKeyPair('giver', keys );

let address = new Address('0:wallet');

let accountStorage = new SimpleAccountsStorage();
accountStorage.addAccount(new EverWalletAccount(address));
accountStorage.defaultAccount = address;
let clock = new Clock();


const ever = new ProviderRpcClient({
    fallback: () =>
        EverscaleStandaloneClient.create({
            connection: {
                id: 2, // network id
                type: 'jrpc',
                data: {
                    // create your own project at https://dashboard.evercloud.dev
                    endpoint: 'http://jrpc.path',
                },
            },
            keystore: keystore,
            accountsStorage: accountStorage,
            clock: clock
        }),
});

const ABI = {
    "ABI version": 1,
    functions: [
        {
            name: "sendGrams",
            inputs: [
                { name: "dest", type: "address" },
                { name: "amount", type: "uint64" },
            ],
            outputs: [],
        },
    ],
    events: [],
    data: [],
} as const;

const WalletAbi = {
    "ABI version": 2,
    "version": "2.3",
    "header": ["pubkey", "time", "expire"],
    "functions": [
        {
            "name": "sendTransaction",
            "inputs": [
                {"name": "dest", "type": "address"},
                {"name": "value", "type": "uint128"},
                {"name": "bounce", "type": "bool"},
                {"name": "flags", "type": "uint8"},
                {"name": "payload", "type": "cell"}
            ],
            "outputs": []
        }
    ],
    "events": [],
} as const;

async function start(): Promise<void> {
    await ever.ensureInitialized();

    await ever.requestPermissions({
        permissions: ['basic'],
    });

    const giver = new ever.Contract(ABI, new Address('-1:1111111111111111111111111111111111111111111111111111111111111111'));
    const { transaction } = await giver.methods.sendGrams({
        dest: new Address('0:wallet'),
        amount: '1000000000000000',
    }).sendExternal({
        withoutSignature: true,
    });

    const subscriber = new ever.Subscriber();
    await subscriber.trace(transaction).finished();
}
async function startWallet(): Promise<void> {
    await ever.ensureInitialized();

    await ever.requestPermissions({
        permissions: ['basic', 'accountInteraction'],
    });



    const wallet = new ever.Contract(WalletAbi, address);

    //const walletState = await ever.getFullContractState({address: wallet.address});
    //const stateInit = !walletState?.state.isDeployed ? stateInit : undefined;

    const {transaction} = await wallet.methods
        .sendTransaction({
            dest: new Address('0:wallet'),
            value: '1000000000', // amount in nano EVER
            bounce: false,
            flags: 3,
            payload: ''
        }).sendExternal({
            publicKey: 'pubkey',
            stateInit: undefined,
        });

    console.log(transaction);
}



start().then(() => console.log("done start")).catch((x) => console.log(x));
startWallet().then(() => console.log("done startWallet")).catch((x) => console.log(x));