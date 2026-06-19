// Global variables
let releaseNotes = []; // List of parsed individual items
let activeFilter = 'all';
let searchQuery = '';
let selectedItem = null;

// DOM Elements
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = refreshBtn.querySelector('.refresh-icon');
const lastUpdatedText = document.getElementById('lastUpdatedText');
const searchInput = document.getElementById('searchInput');
const statsCounter = document.getElementById('statsCounter');
const showingCount = document.getElementById('showingCount');
const liveFeed = document.getElementById('liveFeed');
const emptyFeed = document.getElementById('emptyFeed');
const skeletonFeed = document.getElementById('skeletonFeed');
const filterBtns = document.querySelectorAll('.filter-btn');

// Composer Elements
const sharePanel = document.getElementById('sharePanel');
const composerEmptyState = document.getElementById('composerEmptyState');
const composerForm = document.getElementById('composerForm');
const clearSelectionBtn = document.getElementById('clearSelection');
const composerTag = document.getElementById('composerTag');
const composerDate = document.getElementById('composerDate');
const tweetTextarea = document.getElementById('tweetText');
const charCountSpan = document.getElementById('charCount');
const progressRingCircle = document.querySelector('.progress-ring__circle');
const copyTextBtn = document.getElementById('copyTextBtn');
const tweetBtn = document.getElementById('tweetBtn');
const toast = document.getElementById('toast');

// Circular progress setup
const ringRadius = 10;
const ringCircumference = 2 * Math.PI * ringRadius;
if (progressRingCircle) {
    progressRingCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    progressRingCircle.style.strokeDashoffset = ringCircumference;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.type;
            renderFeed();
        });
    });

    tweetTextarea.addEventListener('input', updateCharCount);
    
    copyTextBtn.addEventListener('click', copyTweetToClipboard);
    tweetBtn.addEventListener('click', shareOnTwitter);
    
    clearSelectionBtn.addEventListener('click', clearSelection);
}

// Fetch notes from Flask API
async function fetchReleaseNotes() {
    // Show spinner & loading state
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
    liveFeed.classList.add('hidden');
    emptyFeed.classList.add('hidden');
    skeletonFeed.classList.remove('hidden');

    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success) {
            processRawEntries(data.entries);
            const now = new Date();
            lastUpdatedText.textContent = `Last synced: ${now.toLocaleTimeString()}`;
            renderFeed();
        } else {
            showErrorState(data.error || 'Failed to fetch release notes.');
        }
    } catch (err) {
        showErrorState(err.message || 'Network error occurred.');
    } finally {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
        skeletonFeed.classList.add('hidden');
    }
}

// Parse Raw XML content into fine-grained updates
function processRawEntries(entries) {
    releaseNotes = [];
    let idCounter = 0;

    entries.forEach(entry => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(entry.content, 'text/html');
        
        // Since docs are HTML, parse section headers and paragraphs
        const children = Array.from(doc.body.children);
        let currentType = 'Announcement'; // Default fallback type
        let currentContentParts = [];

        const createAndSaveItem = () => {
            if (currentContentParts.length > 0) {
                const tempDiv = document.createElement('div');
                currentContentParts.forEach(el => tempDiv.appendChild(el.cloneNode(true)));
                
                const htmlContent = tempDiv.innerHTML;
                const textContent = tempDiv.textContent.trim();
                
                releaseNotes.push({
                    id: `update-${idCounter++}`,
                    date: entry.date,
                    rawDate: new Date(entry.updated || entry.date),
                    type: currentType,
                    contentHtml: htmlContent,
                    plainText: textContent,
                    link: entry.link
                });
                
                currentContentParts = [];
            }
        };

        children.forEach(child => {
            if (child.tagName === 'H3') {
                // Save previous item if it exists
                createAndSaveItem();
                
                // Get the type (Feature, Issue, Announcement, Change, Breaking)
                currentType = child.textContent.trim();
            } else {
                currentContentParts.push(child);
            }
        });

        // Save last item of the entry
        createAndSaveItem();
    });

    // Sort entries by date descending
    releaseNotes.sort((a, b) => b.rawDate - a.rawDate);
}

// Show Error
function showErrorState(message) {
    lastUpdatedText.textContent = `Error: ${message}`;
    liveFeed.innerHTML = `
        <div class="empty-feed">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-breaking)">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3>Sync Failed</h3>
            <p>${message}</p>
        </div>
    `;
    liveFeed.classList.remove('hidden');
}

// Render release notes to feed
function renderFeed() {
    liveFeed.innerHTML = '';
    
    // Filter and search notes
    const filteredNotes = releaseNotes.filter(note => {
        const matchesFilter = activeFilter === 'all' || note.type.toLowerCase() === activeFilter.toLowerCase();
        
        const matchesSearch = searchQuery === '' || 
            note.plainText.toLowerCase().includes(searchQuery) ||
            note.type.toLowerCase().includes(searchQuery) ||
            note.date.toLowerCase().includes(searchQuery);
            
        return matchesFilter && matchesSearch;
    });

    showingCount.textContent = filteredNotes.length;

    if (filteredNotes.length === 0) {
        emptyFeed.classList.remove('hidden');
        liveFeed.classList.add('hidden');
        return;
    }

    emptyFeed.classList.add('hidden');
    liveFeed.classList.remove('hidden');

    // Group filtered items by Date
    const grouped = {};
    filteredNotes.forEach(note => {
        if (!grouped[note.date]) {
            grouped[note.date] = [];
        }
        grouped[note.date].push(note);
    });

    // Generate HTML
    Object.keys(grouped).forEach(date => {
        const daySection = document.createElement('section');
        daySection.className = 'release-day';
        
        daySection.innerHTML = `
            <div class="day-header">
                <span class="day-title">${date}</span>
                <div class="day-line"></div>
            </div>
            <div class="day-items"></div>
        `;
        
        const itemsContainer = daySection.querySelector('.day-items');
        
        grouped[date].forEach(item => {
            const isSelected = selectedItem && selectedItem.id === item.id;
            const card = document.createElement('div');
            card.className = `update-card ${isSelected ? 'selected' : ''}`;
            card.dataset.id = item.id;
            
            const badgeClass = item.type.toLowerCase();
            
            card.innerHTML = `
                <div class="update-header">
                    <span class="tag-badge ${badgeClass}">${item.type}</span>
                    <span class="action-trigger">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                        <span>${isSelected ? 'Selected' : 'Select to Tweet'}</span>
                    </span>
                </div>
                <div class="update-body">${item.contentHtml}</div>
            `;
            
            card.addEventListener('click', () => selectItem(item));
            itemsContainer.appendChild(card);
        });
        
        liveFeed.appendChild(daySection);
    });
}

// Select an update item
function selectItem(item) {
    selectedItem = item;
    
    // Update active state in feed list
    document.querySelectorAll('.update-card').forEach(card => {
        if (card.dataset.id === item.id) {
            card.classList.add('selected');
            card.querySelector('.action-trigger span').textContent = 'Selected';
        } else {
            card.classList.remove('selected');
            card.querySelector('.action-trigger span').textContent = 'Select to Tweet';
        }
    });

    // Populate Tweet Composer
    composerEmptyState.classList.add('hidden');
    composerForm.classList.remove('hidden');
    
    composerTag.className = `meta-tag tag-badge ${item.type.toLowerCase()}`;
    composerTag.textContent = item.type;
    composerDate.textContent = item.date;
    
    // Format default tweet text
    // Truncate description text to fit tweet intent naturally
    let cleanText = item.plainText
        .replace(/\s+/g, ' ')
        .trim();
        
    // Format: 📢 BigQuery Feature (June 17, 2026): You can enable autonomous embedding generation on tables...
    // Twitter has 280 char limit. Leave room for prefix & link
    const prefix = `📢 BigQuery ${item.type} (${item.date}): `;
    const suffix = `\n\nDetails: ${item.link}`;
    const maxDescLength = 280 - prefix.length - suffix.length - 4; // 4 char buffer for "..."
    
    if (cleanText.length > maxDescLength) {
        cleanText = cleanText.substring(0, maxDescLength).trim() + '...';
    }
    
    tweetTextarea.value = `${prefix}${cleanText}${suffix}`;
    updateCharCount();
}

// Clear currently selected item
function clearSelection() {
    selectedItem = null;
    document.querySelectorAll('.update-card').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('.action-trigger span').textContent = 'Select to Tweet';
    });
    
    composerForm.classList.add('hidden');
    composerEmptyState.classList.remove('hidden');
}

// Update Character count circular ring & number
function updateCharCount() {
    const text = tweetTextarea.value;
    const length = text.length;
    const remaining = 280 - length;
    
    charCountSpan.textContent = remaining;
    
    // Ring progress
    const progress = Math.min(length / 280, 1);
    const offset = ringCircumference - (progress * ringCircumference);
    progressRingCircle.style.strokeDashoffset = offset;
    
    // Styling states
    if (remaining < 0) {
        charCountSpan.className = 'char-count danger';
        progressRingCircle.style.stroke = 'var(--color-breaking)';
        tweetBtn.disabled = true;
    } else if (remaining <= 20) {
        charCountSpan.className = 'char-count warning';
        progressRingCircle.style.stroke = 'var(--color-issue)';
        tweetBtn.disabled = false;
    } else {
        charCountSpan.className = 'char-count';
        progressRingCircle.style.stroke = 'var(--primary-color)';
        tweetBtn.disabled = false;
    }
}

// Copy Tweet text to Clipboard
function copyTweetToClipboard() {
    tweetTextarea.select();
    document.execCommand('copy');
    
    // Show toast
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Share on Twitter Web Intent
function shareOnTwitter() {
    const text = tweetTextarea.value;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}
