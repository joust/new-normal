#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function cleanText(text) {
    return text
        .replace(/&shy;/g, '')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&amp;/g, '&')
        .trim()
        .replace(/\s+/g, ' ');
}

function extractAttributes(element) {
    const attrRegex = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
    let attrs = {};
    let match;
    
    while ((match = attrRegex.exec(element)) !== null) {
        attrs[match[1]] = match[2];
    }
    
    return attrs;
}

function parseTopicsMetadata(content) {
    const topics = {};
    const sectionRegex = /<section([^>]*)>/g;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
        const attrs = extractAttributes(match[1]);
        if (!attrs.id) continue;
        
        topics[attrs.id] = {
            id: attrs.id,
            title: cleanText(attrs.title || ''),
            idiotTitle: cleanText(attrs['data-idiot-title'] || ''),
            sheepTitle: cleanText(attrs['data-sheep-title'] || ''),
            idiotLabel: cleanText(attrs['data-idiot-label'] || ''),
            sheepLabel: cleanText(attrs['data-sheep-label'] || ''),
            arguments: []
        };
    }
    
    return topics;
}

function parseArguments(content) {
    const args = {};
    const argRegex = /<a id="([^"]+)"[^>]*>(?:[^<]*<h2>([^<]+)<\/h2>)?(?:[^<]*<p>([^<]+)<\/p>)?/g;
    let match;
    
    while ((match = argRegex.exec(content)) !== null) {
        const [_, id, title, details] = match;
        if (!id) continue;
        
        args[id] = {
            id,
            title: cleanText(title || ''),
            details: cleanText(details || '')
        };
    }
    
    return args;
}

function parseTopicArguments(content) {
    const topicArgs = {};
    const sectionRegex = /<section id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
    const argRegex = /<a id="([^"]+)"/g;
    let sectionMatch;
    
    while ((sectionMatch = sectionRegex.exec(content)) !== null) {
        const [_, topicId, sectionContent] = sectionMatch;
        if (!topicId) continue;
        
        const args = [];
        let argMatch;
        while ((argMatch = argRegex.exec(sectionContent)) !== null) {
            args.push(argMatch[1]);
        }
        
        topicArgs[topicId] = args;
    }
    
    return topicArgs;
}

async function main() {
    const baseDir = path.join(__dirname, '..', 'content', 'pandemic');
    
    try {
        // Read all input files
        const [topicsMetadata, idiotContent, sheepContent, topicsContent] = await Promise.all([
            fs.readFile(path.join(baseDir, 'en', 'topics.html'), 'utf8'),
            fs.readFile(path.join(baseDir, 'en', 'idiot.html'), 'utf8'),
            fs.readFile(path.join(baseDir, 'en', 'sheep.html'), 'utf8'),
            fs.readFile(path.join(baseDir, 'topics.html'), 'utf8')
        ]);
        
        // Parse topics metadata
        const topics = parseTopicsMetadata(topicsMetadata);
        
        // Parse arguments
        const idiotArgs = parseArguments(idiotContent);
        const sheepArgs = parseArguments(sheepContent);
        
        // Parse topic-argument assignments
        const topicArgs = parseTopicArguments(topicsContent);
        
        // Assign arguments to topics
        for (const [topicId, args] of Object.entries(topicArgs)) {
            if (topics[topicId]) {
                topics[topicId].arguments = args;
            }
        }
        
        // Create final JSON structure
        const output = {
            topics: Object.values(topics),
            arguments: {
                idiot: Object.values(idiotArgs),
                sheep: Object.values(sheepArgs)
            }
        };
        
        // Write to JSON file
        const outputPath = path.join(baseDir, 'data.json');
        await fs.writeFile(
            outputPath,
            JSON.stringify(output, null, 2),
            'utf8'
        );
        
        console.log('Successfully converted HTML files to JSON');
        
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

main();
