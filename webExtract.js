import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import Bottleneck from 'bottleneck';

// Configure rate limiter
const limiter = new Bottleneck({
    minTime: 1000, // Minimum time between requests (1 second)
    maxConcurrent: 1 // Only allow one request at a time
});

// Common user agents for different browsers
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

// Get a random user agent
const getRandomUserAgent = () => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// Configure proxy if available
const getProxyAgent = () => {
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    return proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;
};

// Validate URL
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Sanitize URL to prevent malicious requests
const sanitizeUrl = (url) => {
    // Only allow http and https protocols
    const sanitized = new URL(url);
    if (!['http:', 'https:'].includes(sanitized.protocol)) {
        throw new Error('Invalid URL protocol');
    }
    return sanitized.toString();
};

// Create error response
const createErrorResponse = (error) => ({
    success: false,
    error: error.message || 'Failed to extract content',
    timestamp: new Date().toISOString()
});

/**
 * Extracts content from a webpage using Cheerio
 * @param {Object} params - The extraction parameters
 * @param {string} params.url - The URL to extract content from
 * @param {boolean} [params.includeImages=false] - Whether to include images in results
 * @returns {Promise<Object>} - The extracted content
 */
export async function extractContent({ 
    url, 
    includeImages = false 
}) {
    try {
        // Validate URL
        if (!isValidUrl(url)) {
            return createErrorResponse(new Error('Invalid URL format'));
        }

        // Sanitize URL
        const sanitizedUrl = sanitizeUrl(url);

        // Configure fetch options
        const fetchOptions = {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            },
            timeout: 10000, // 10 second timeout
            agent: getProxyAgent()
        };

        // Use rate limiter for the fetch request
        const response = await limiter.schedule(() => fetch(sanitizedUrl, fetchOptions));

        if (!response.ok) {
            return createErrorResponse(new Error(`Failed to fetch URL: ${response.statusText} (${response.status})`));
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            return createErrorResponse(new Error('URL does not point to a valid HTML page'));
        }

        const html = await response.text();
        const $ = cheerio.load(html, {
            decodeEntities: true,
            normalizeWhitespace: true
        });

        // Remove potentially harmful elements
        $('script, style, iframe, frame, object, embed, form, input, button').remove();

        // Get text content
        const title = $('title').text().trim();
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        
        // Get main content (prioritize semantic elements)
        const mainContent = $('main, article, .content, #content, .main, [role="main"]')
            .first()
            .text()
            .trim() || $('body').text().trim();

        // Extract images if requested
        let images = [];
        if (includeImages) {
            const baseUrl = new URL(sanitizedUrl);
            const pageUrl = baseUrl.pathname.endsWith('/') ? 
                baseUrl : new URL(baseUrl.pathname + '/', baseUrl);
            // Only process images with valid src attributes
            images = $('img[src]').map((_, img) => {
                const src = $(img).attr('src');
                try {
                    // Resolve relative URLs to absolute URLs
                    const absoluteSrc = src.startsWith('/') ? 
                        new URL(src, baseUrl).toString() : 
                        new URL(src, pageUrl).toString();
                    return {
                        src: absoluteSrc,
                        alt: $(img).attr('alt') || '',
                        title: $(img).attr('title') || ''
                    };
                } catch {
                    // Skip invalid image URLs
                    return null;
                }
            }).get().filter(Boolean); // Remove null entries
        }

        // Clean up the text
        const cleanText = mainContent
            .replace(/\s+/g, ' ')
            .replace(/[^\S\r\n]+/g, ' ')
            .trim();

        return {
            success: true,
            data: {
                title,
                description: metaDescription,
                content: cleanText,
                images: includeImages ? images : undefined,
                url: sanitizedUrl,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Web extraction error:', error);
        return createErrorResponse(error);
    }
}


async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Please provide a URL as an argument.');
        process.exit(1);
    }

    const url = args[0];

    try {
        const content = await extractContent({ url, includeImages: true });
        console.log('Extracted Content:', content);
    } catch (error) {
        console.error('Error extracting content:', error);
    }
}

main();
