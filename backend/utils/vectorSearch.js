const Knowledge = require('../models/Knowledge');

const dotProduct = (vecA, vecB) => {
    return vecA.reduce((sum, val, i) => sum + val * (vecB[i] || 0), 0);
};

const magnitude = (vec) => {
    return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
};

const cosineSimilarity = (vecA, vecB) => {
    const dot = dotProduct(vecA, vecB);
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
};

const findRelevantContext = async (queryEmbedding, limit = 3) => {
    try {
        const allKnowledge = await Knowledge.find({});

        const scoredKnowledge = allKnowledge.map((item) => ({
            ...item.toObject(),
            similarity: cosineSimilarity(queryEmbedding, item.embedding),
        }));

        // Sort by similarity and take top results
        const topResults = scoredKnowledge
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        return topResults.map(r => r.content).join('\n\n');
    } catch (error) {
        console.error('Error finding relevant context:', error);
        return '';
    }
};

module.exports = { findRelevantContext };
