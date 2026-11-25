const FACT_API_URL = 'https://uselessfacts.jsph.pl/api/v2/facts/random';
const FETCH_TIMEOUT_MS = 8000;
const COMPACT_STORAGE_KEY = 'hw5-facts-compact';

/* --- Storage helpers (read and write fail independently) --- */

function loadCompactPreference() {
    const fallback = true; // default when nothing valid is saved
    try {
        const saved = localStorage.getItem(COMPACT_STORAGE_KEY);
        if (saved === 'true' || saved === 'false') {
            return saved === 'true';
        }
    } catch (error) {
        console.error('Could not read compact preference:', error);
    }
    return fallback;
}

function saveCompactPreference(compact) {
    try {
        localStorage.setItem(COMPACT_STORAGE_KEY, compact ? 'true' : 'false');
    } catch (error) {
        console.error('Could not save compact preference:', error);
    }
}

/* --- Errors --- */

class FactError extends Error {
    constructor(kind, httpStatus = null) {
        super(kind);
        this.kind = kind; // 'timeout' | 'network' | 'http' | 'parse' | 'invalid'
        this.httpStatus = httpStatus;
    }
}

function messageForError(error) {
    if (!(error instanceof FactError)) {
        return 'Something went wrong. Please try again.';
    }

    switch (error.kind) {
        case 'timeout':
            return 'The request timed out. Please try again.';
        case 'network':
            return 'Network error. Check your internet connection and try again.';
        case 'http':
            if (error.httpStatus === 429) {
                return 'Too many requests. Wait a moment and try again.';
            }
            if (error.httpStatus >= 500) {
                return `The fact server is having problems (error ${error.httpStatus}). Try again later.`;
            }
            return `The request failed (error ${error.httpStatus}). Please try again.`;
        case 'parse':
            return 'The server sent a response that could not be read. Please try again.';
        case 'invalid':
            return 'The server sent a fact in an unexpected format. Please try again.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

/* --- Component --- */

class UselessFact extends HTMLElement {
    static get observedAttributes() {
        return ['compact', 'status'];
    }

    constructor() {
        super();
        this.facts = [
            "Ducks can fly as high as airplanes! The current highest recorded flight is 21,000 feet (6,400 meters).",
        ];
        this.current_fact = 0;
        this.fetching = false;
        this.built = false;
    }

    connectedCallback() {
        if (!this.built) {
            this.build();
        }

        if (!this.hasAttribute('status')) {
            this.setAttribute('status', 'Idle');
        }

        this.toggleAttribute('compact', loadCompactPreference());

        this.renderFact();
        this.renderStatus();
        this.renderControls();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.built || oldValue === newValue) return;

        if (name === 'compact') {
            this.renderFact();
        } else if (name === 'status') {
            this.renderStatus();
        }
    }

    /* --- Building the interface (runs once) --- */

    build() {
        this.header = document.createElement('h2');

        this.factList = document.createElement('ol');
        this.factList.className = 'fact-list';

        this.statusMessage = document.createElement('p');
        this.statusMessage.setAttribute('role', 'status');
        this.statusMessage.className = 'fact-status';

        this.previousButton = document.createElement('button');
        this.previousButton.type = 'button';
        this.previousButton.className = 'previous-fact';
        this.previousButton.textContent = 'Previous Fact';
        this.previousButton.addEventListener('click', () => this.previousFact());

        this.nextButton = document.createElement('button');
        this.nextButton.type = 'button';
        this.nextButton.className = 'next-fact';
        this.nextButton.textContent = 'Next Fact';
        this.nextButton.addEventListener('click', () => this.nextFact());

        const controls = document.createElement('menu');
        controls.className = 'fact-controls';

        const previousItem = document.createElement('li');
        previousItem.append(this.previousButton);

        const nextItem = document.createElement('li');
        nextItem.append(this.nextButton);

        controls.append(previousItem, nextItem);

        // Replaces the <noscript> fallback, which only matters when JS is off
        this.replaceChildren(this.header, this.factList, this.statusMessage, controls);
        this.built = true;
    }

    /* --- Rendering --- */

    renderFact() {
        const compact = this.hasAttribute('compact');

        if (compact) {
            this.header.textContent = `Useless Fact ${this.current_fact + 1} of ${this.facts.length}`;
        } else {
            this.header.textContent = `${this.facts.length} Useless Facts`;
        }

        const indexes = compact
            ? [this.current_fact]
            : this.facts.map((_, i) => i);

        const items = indexes.map((i) => {
        const li = document.createElement('li');
            li.textContent = this.facts[i]; // textContent keeps remote text from being parsed as HTML
            if (i === this.current_fact) {
                li.className = 'current-fact';
                li.setAttribute('aria-current', 'true');
            }
            return li;
        });

        this.factList.start = indexes[0] + 1;
        this.factList.replaceChildren(...items);
    }

    renderStatus() {
        this.statusMessage.textContent = `Status: ${this.getAttribute('status') ?? ''}`;
    }

    renderControls() {
        const atEnd = this.current_fact === this.facts.length - 1;
        this.nextButton.textContent = atEnd ? 'Load New Fact' : 'Next Fact';
    }

    setBusy(busy) {
        this.setAttribute('aria-busy', busy ? 'true' : 'false');
        this.previousButton.disabled = busy;
        this.nextButton.disabled = busy;
    }

    /* --- Navigation --- */

    nextFact() {
        if (this.fetching) return;

        if (this.current_fact === this.facts.length - 1) {
            this.fetchUselessFact();
        } else {
            this.current_fact += 1;
            this.setAttribute('status', 'Idle');
            this.renderFact();
            this.renderControls();
        }
    }

    previousFact() {
        if (this.fetching) return;

        this.current_fact = (this.current_fact - 1 + this.facts.length) % this.facts.length;
        this.setAttribute('status', 'Idle');
        this.renderFact();
        this.renderControls();
    }

    /* --- Fetching --- */

    // Returns a validated fact string or throws a FactError
    async requestFact(signal) {
        let response;
        try {
            response = await fetch(FACT_API_URL, {
                signal,
                headers: { Accept: 'application/json' }
            });
        } catch (error) {
            throw new FactError(error.name === 'AbortError' ? 'timeout' : 'network');
        }

        if (!response.ok) {
            throw new FactError('http', response.status);
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new FactError(error.name === 'AbortError' ? 'timeout' : 'parse');
        }

        if (
            typeof data !== 'object' || data === null ||
            typeof data.text !== 'string' || data.text.trim() === ''
        ) {
            throw new FactError('invalid');
        }

        return data.text.trim();
    }

    async fetchUselessFact() {
        if (this.fetching) return;
        this.fetching = true;

        const restoreFocus = document.activeElement === this.nextButton;

        this.setBusy(true);
        this.setAttribute('status', 'Fetching a new fact...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const text = await this.requestFact(controller.signal);
            this.facts.push(text);
            this.current_fact = this.facts.length - 1;
            this.renderFact();
            this.renderControls();
            this.setAttribute('status', 'Loaded a new fact.');
        } catch (error) {
            console.error('Error fetching a useless fact:', error);
            this.setAttribute('status', messageForError(error));
        } finally {
            clearTimeout(timeoutId);
            this.fetching = false;
            this.setBusy(false);
            if (restoreFocus) this.nextButton.focus();
        }
    }
}

customElements.define('useless-fact', UselessFact);

/* --- External control: toggle compact view --- */

const factElement = document.querySelector('useless-fact');

const toggleCompactButton = document.createElement('button');
toggleCompactButton.type = 'button';
toggleCompactButton.className = 'toggle-compact';
toggleCompactButton.textContent = 'Toggle Compact View';
toggleCompactButton.setAttribute('aria-label', 'Toggle compact view of useless facts');
toggleCompactButton.setAttribute('aria-controls', factElement.id || 'useless-fact-component');
toggleCompactButton.setAttribute('aria-pressed', factElement.hasAttribute('compact'));

toggleCompactButton.addEventListener('click', () => {
    factElement.toggleAttribute('compact');
    const compact = factElement.hasAttribute('compact');
    toggleCompactButton.setAttribute('aria-pressed', compact);
    saveCompactPreference(compact);
});

factElement.insertAdjacentElement('afterend', toggleCompactButton);