const express = require('express');
const axios = require('axios');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');

// Ensure the cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

// Helper function to generate a unique filename based on the URL
function getCacheFilename(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return path.join(CACHE_DIR, `${hash}.css`);
}

app.get('/minify', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a URL as a query parameter.' });
    }

    const cacheFile = getCacheFilename(url);

    // Check if the minified CSS is already cached
    if (fs.existsSync(cacheFile)) {
        // Serve from cache
        console.log('Serving from cache:', cacheFile);
        return res.sendFile(cacheFile);
    }

    try {
        // Fetch CSS from the given URL
        const response = await axios.get(url);
        const inputCss = response.data;

        // Minify the CSS
        const output = new CleanCSS().minify(inputCss);

        if (output.styles) {
            // Save the minified CSS to the cache
            fs.writeFileSync(cacheFile, output.styles, 'utf-8');
            console.log('CSS minified and saved to cache:', cacheFile);

            // Serve the minified CSS
            res.setHeader('Content-Type', 'text/css');
            res.send(output.styles);
        } else {
            res.status(500).json({ error: 'Error minifying CSS.', details: output.errors });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch or minify CSS.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`CSS minifier service is running on http://localhost:${PORT}`);
});
