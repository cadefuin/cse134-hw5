class UselessFact extends HTMLElement {
    static get observedAttributes() {
        return ['compact', 'status'];
    }

    constructor() {
        super();
        this.facts = [
            "A group of flamingos is called a 'flamboyance'.",
            "Bananas are berries, but strawberries are not."
        ];
        this.current_fact = 1;
        this.total_facts = this.facts.length;

        this.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-compact')) {
                this.toggleAttribute('compact');

                try {
                    localStorage.setItem(
                        'hw5-facts-compact',
                        this.hasAttribute('compact') ? 'true' : 'false'
                    );
                } catch (error) {
                    console.error('Could not save compact preference:', error);
                }
            }
        });
    }

    connectedCallback() {
        if (!this.hasAttribute('status')) this.setAttribute('status', 'Idle');

        let compact = true; // default when nothing valid is saved

        try {
            const saved = localStorage.getItem('hw5-facts-compact');
            if (saved === 'true' || saved === 'false') {
                compact = saved === 'true';
            }
            else {
                localStorage.setItem('hw5-facts-compact', compact.toString());
            }
        } catch (error) {
            console.error('Could not read compact preference:', error);
        }

        this.toggleAttribute('compact', compact);
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this.render();
    }

    nextFact() {
        if (this.current_fact === this.facts.length - 1) {
            this.fetchUselessFact();
        } else {
            this.current_fact = (this.current_fact + 1) % this.facts.length;
            this.render();
        }
    }

    previousFact() {
        this.current_fact = (this.current_fact - 1 + this.facts.length) % this.facts.length;
        this.render();
    }

    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        let html;
        if (this.hasAttribute('compact')) {
            html = `
                <h3>Useless Fact ${this.current_fact + 1} of ${this.total_facts}</h3>
                <p class="current-fact">${this.escape(this.facts[this.current_fact])}</p>`;
        } else {
            html = `<h3>${this.total_facts} Useless Facts</h3>` +
                this.facts.map((fact, i) =>
                    `<p${i === this.current_fact ? ' class="current-fact"' : ''}>${this.escape(fact)}</p>`
                ).join('');
        }

        html += `
            <p role="status">Status: ${this.escape(this.getAttribute('status') ?? '')}</p>
            <button class="toggle-compact" aria-pressed="${this.hasAttribute('compact')}">Toggle Compact View</button>`;

        this.innerHTML = html;
    }

    async fetchUselessFact() {
        try {
            this.setAttribute('status', 'Fetching...');
            const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');

            if (response.ok) {
                const data = await response.json();
                this.facts.push(data.text);
                this.current_fact = this.facts.length - 1;
                this.total_facts = this.facts.length;
                this.setAttribute('status', 'Loaded');
            } else {
                console.error('Failed to fetch a useless fact:', response.status, response.statusText);
                this.setAttribute('status', 'Error. Check your internet connection and try again.');
            }
        } catch (error) {
            console.error('Error fetching a useless fact:', error);
            this.setAttribute('status', 'Error. Check your internet connection and try again.');
        }
    }
}

customElements.define('useless-fact', UselessFact);

const factElement = document.querySelector('useless-fact');



// Next Fact Button
const nextFactButton = document.createElement('button');
nextFactButton.className = 'next-fact';
nextFactButton.textContent = 'Next Fact';

nextFactButton.addEventListener('click', () => factElement.nextFact());

factElement.insertAdjacentElement('afterend', nextFactButton);


// Previous Fact Button
const previousFactButton = document.createElement('button');
previousFactButton.className = 'previous-fact';
previousFactButton.textContent = 'Previous Fact';

previousFactButton.addEventListener('click', () => factElement.previousFact());

factElement.insertAdjacentElement('afterend', previousFactButton);