import { Address, ProviderRpcClient } from 'everscale-inpage-provider';
import { EverscaleStandaloneClient } from 'everscale-standalone-client/nodejs';

// @ts-ignore
const ever = new ProviderRpcClient({
    fallback: () =>
        EverscaleStandaloneClient.create({
            connection: {
                id: 2, // network id
                type: 'jrpc',
                data: {
                    // create your own project at https://dashboard.evercloud.dev
                    endpoint: 'https://jrpc.path',
                },
            },
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

    console.log("hello");
    const subscriber = new ever.Subscriber();
    await subscriber.trace(transaction).finished();
}


start().then(() => console.log("done")).catch((x) => console.log(x));