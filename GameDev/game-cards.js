/**
 * Game Cards Data
 * 
 * An array of game objects, each containing a title, description, link, and image.
 */

let games = [
    {
        title: "teeny tiny factory",
        description: "You are tasked with sorting plushies to assure their utmost quality! Created solo for teeny-tinyware 2025 - the 24 hour game jam hosted by the Video Game Development Club @ UC San Diego.",
        link: "teenytinyfactory/index.html",
        image: "teenytinyfactory/Media/Cover Image 630x500.png"
    },
    {
        title: "Mariposa",
        description: "Mariposa is a 2D puzzle-platformer game that splits you between two worlds: a vibrant past where human society has seemingly progressed beyond the bounds of imagination, and a distant future where paradise has crumbled into an abandoned ruin.",
        link: "Mariposa/index.html",
        image: "/Mariposa/Media/Library_Capsule_2.png"
    }
];



/**
 * GameCard Custom Element
 * 
 * A custom element for displaying a game card with a title, description, link, and image.
 */

class GameCard extends HTMLElement {
    static observedAttributes = ['is_compact'];

    constructor(game_id, is_compact = false) {
        super();

        this.game_title = games[game_id].title;
        this.description = games[game_id].description;
        this.link = games[game_id].link;
        this.image = games[game_id].image;

        this.is_compact = is_compact;
        this.render();
    }

    render() {
        this.innerHTML = `
            <h3>${this.game_title}</h3>
            <img src="${this.image}" alt="${this.game_title} cover image">`
            if (!this.is_compact) {
                this.innerHTML += `<p>${this.description}</p>`;
            }
            this.innerHTML += `<a href="${this.link}"><button>Play Now</button></a>`;
        ;
    }

    connectedCallback() {
        console.log(`GameCard for ${this.game_title} has been added to the DOM. Compact view is ${this.is_compact ? 'enabled' : 'disabled'}.`);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'is_compact') {
            this.render();
        }
    }
}


/**
 * GameGallery Custom Element
 * 
 * A custom element for displaying a gallery of game cards.
 */

class GameGallery extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        
    }
}



/**
 * Define Custom Elements
 */

customElements.define('game-gallery', GameGallery);
customElements.define('game-card', GameCard);


// Populate the game gallery with game cards
gallery = document.querySelector('game-gallery');
for (let i = 0; i < games.length; i++) {
    const gameCard = new GameCard(i);
    gallery.appendChild(gameCard);
}


// Add event listener to toggle view button
for (toggleButton of document.querySelectorAll('.toggle-view')) {
    toggleButton.addEventListener('click', () => {
        for (gameCard of document.querySelectorAll('game-card')) {
            gameCard.toggleAttribute('is_compact');
        }
        console.log('Toggle view button clicked. Compact view is now ' + (document.querySelector('game-card').is_compact ? 'enabled' : 'disabled') + '.');
    });
}


//TODO: check why toggle does not actually change the attribute