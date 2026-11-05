import { getBatchEmbeddings } from './modules/embeddings.js';

async function test() {
    try {
        const res = await getBatchEmbeddings(["hello world", "test string"], "AIzaSyB8za6WvR46JvYJXYoo94ywtYA6aHENmuE");
        console.log("Success", res.length);
    } catch(e) {
        console.error("Failed:", e.message);
    }
}
test();
