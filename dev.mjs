import * as squint_core from 'squint-cljs/core.js';
import { readFileSync, copyFile } from 'fs';
import 'dotenv/config';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { createComposite, readEncodedComposite, writeEncodedComposite, writeRuntimeDefinition, mergeEncodedComposites, writeEncodedCompositeRuntime } from '@composedb/devtools-node';
import { Composite } from '@composedb/devtools';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { fromString } from 'uint8arrays/from-string';
var ceramic = new CeramicClient("http://localhost:7007");
var authenticate = async function (ceramic) {
const seed1 = squint_core.get(squint_core.get(process, "env"), "DID_PRIVATE_KEY");
const key2 = fromString(seed1, "base16");
const did3 = new DID(({ "resolver": getResolver(), "provider": new Ed25519Provider(key2) }));
return did3.authenticate().then((function () {
return squint_core.aset(ceramic, "did", did3);
}));
};
var write_composite = async function (ceramic) {
const categoryComposite1 = (await createComposite(ceramic, "./src/main/composedb/model/category.graphql"));
const category_id2 = categoryComposite1.modelIDs[0];
const contractComposite3 = (await createComposite(ceramic, "./src/main/composedb/model/contract.graphql"));
const contract_id4 = contractComposite3.modelIDs[0];
const project_schema5 = readFileSync("./src/main/composedb/model/project.graphql", ({ "encoding": "utf-8" })).replace("$CATEGORY_ID", category_id2).replace("$CONTRACT_ID", contract_id4);
const projectComposite6 = (await Composite.create(({ "ceramic": ceramic, "schema": project_schema5 })));
const userComposite7 = (await createComposite(ceramic, "./src/main/composedb/model/user.graphql"));
const composite8 = (await Composite.from([categoryComposite1, contractComposite3, projectComposite6, userComposite7]));
const asd9 = (await writeEncodedComposite(composite8, "./src/__generated__/definition.json"));
const merged10 = (await writeEncodedCompositeRuntime(ceramic, "./src/__generated__/definition.json", "./src/__generated__/definition.js"));
const merged11 = (await writeEncodedCompositeRuntime(ceramic, "./src/__generated__/definition.json", "./src/__generated__/merged-rt.json"));
const merged12 = (await readEncodedComposite(ceramic, "./src/__generated__/definition.json"));
const new$13 = (await writeRuntimeDefinition(merged12, "./src/__generated__/definition-merged.json"));
return (await merged12.startIndexingOn(ceramic));
};
authenticate(ceramic).then((function () {
return squint_core.println(ceramic);
}));

export { ceramic, authenticate, write_composite }
