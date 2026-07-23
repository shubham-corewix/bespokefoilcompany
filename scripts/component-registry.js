/*
 * BFC COMPONENT LIBRARY - registry (single source of truth)
 * ----------------------------------------------------------
 * This file drives /component-library. To add a component:
 *   1. Add an entry to the relevant category array below.
 *   2. Give it the next free short code (H03, G04, CTA02...).
 *   3. Run:  node scripts/generate-component-library.js
 *
 * `html` is the live preview markup. It reuses real BFC tokens from
 * /shared/styles.css plus the catalogue's own demo-* helper classes
 * (defined once in the generator's <style> block).
 *
 * Naming convention (LOCKED): short codes.
 *   H = Header,  G = Gallery,  B = Body,  CTA = CTA band,
 *   T = Testimonial,  P = Pricing,  F = FAQ,  FORM = Form,  FT = Footer.
 *
 * Images: real BFC photography from /assets. Keep previews pointing at
 * real files so the catalogue always reflects the true look.
 */

const CATEGORIES = [
  { id: 'headers',      code: 'H',    title: 'Headers',            blurb: 'Site chrome - the bar at the very top of a page and how it sits over the content beneath.' },
  { id: 'galleries',    code: 'G',    title: 'Scrolling Galleries', blurb: 'Horizontal, swipeable rows for showing sets of things - products, regions, press, testimonials.' },
  { id: 'body',         code: 'B',    title: 'Body Layouts',       blurb: 'The content blocks that make up the middle of a page. Mix and stack these to build anything.' },
  { id: 'cta',          code: 'CTA',  title: 'CTA Bands',          blurb: 'Full-width prompts that ask the reader to do one thing. Usually between sections or before the footer.' },
  { id: 'testimonials', code: 'T',    title: 'Testimonials',       blurb: 'Social proof - real words from real parents, with the trust signals that back them up.' },
  { id: 'pricing',      code: 'P',    title: 'Pricing Tables',     blurb: 'Side-by-side plans and package comparisons.' },
  { id: 'faq',          code: 'F',    title: 'FAQ Accordions',     blurb: 'Expandable question-and-answer lists that keep long content tidy.' },
  { id: 'forms',        code: 'FORM', title: 'Forms',              blurb: 'Sign-up, enquiry and contact layouts.' },
  { id: 'footers',      code: 'FT',   title: 'Footers',            blurb: 'The closing block of every page - navigation, contact, trust and legal.' },
];

/* ---- shared snippets kept DRY ---- */
const cartSvg = '<svg viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12L6 6z"/><path d="M6 6L5 3H2"/></svg>';
const arrowSvg = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const miniHeader = (mode, extra = '') => `
        <div class="mini-hd ${mode} ${extra}">
          <div class="mini-burger"><span></span><span></span><span></span></div>
          <div class="mini-logo">Bespoke Foil Company</div>
          <div class="mini-right">
            <span class="mini-pill">Order Kit</span>
            <span class="mini-cart">${cartSvg}</span>
          </div>
        </div>`;

const COMPONENTS = {

  /* ============ HEADERS ============ */
  headers: [
    { code: 'H01', name: 'Dark hero overlay',
      desc: 'Transparent bar over a dark hero, white logo and marks. The site default for immersive pages (home, our-story, franchise).',
      dark: true,
      html: `
      <div class="demo-hero dark" style="background-image:url('/assets/mc-hero-1200.webp')">
        ${miniHeader('on-dark')}
        <div class="demo-hero-copy">
          <p class="eyebrow">Over 10,000 kits sold</p>
          <h4>Preserve their tiny hands and feet</h4>
        </div>
      </div>` },
    { code: 'H02', name: 'Light solid bar',
      desc: 'Solid porcelain bar with a subtle drop shadow to separate it from a light body. Used on our-kit and light-scope pages.',
      html: `
      <div class="demo-hero light">
        ${miniHeader('on-light', 'solid')}
        <div class="demo-hero-copy" style="margin-top:40px">
          <p class="eyebrow">Our Kit</p><h4>Everything in the box</h4>
        </div>
      </div>` },
    { code: 'H03', name: 'Centred logo, minimal',
      desc: 'Wordmark centred with controls either side. A quieter, editorial feel for content and campaign pages.',
      html: `
      <div class="demo-hero light">
        <div class="mini-hd on-light centred solid">
          <div class="mini-side l"><div class="mini-burger"><span></span><span></span><span></span></div></div>
          <div class="mini-logo">Bespoke Foil Company</div>
          <div class="mini-side r"><span class="mini-cart">${cartSvg}</span></div>
        </div>
        <div class="demo-hero-copy" style="margin-top:40px">
          <p class="eyebrow">Stories &amp; Inspiration</p><h4>The journal</h4>
        </div>
      </div>` },
  ],

  /* ============ GALLERIES ============ */
  galleries: [
    { code: 'G01', name: 'Snap-scroll cards',
      desc: 'Even cards that snap into place as you swipe. The workhorse for product ranges and feature sets.',
      html: `
      <div class="demo-scroll">
        ${[['gallery-01','Foil Kit','Hand & footprint keepsake'],['gallery-02','Premium Frame','Museum-grade mount'],['gallery-03','Twin Set','Two prints, one frame'],['gallery-04','Keepsake Box','Beautifully presented'],['gallery-05','Add-ons','Make it yours']]
          .map(([img,t,s])=>`<div class="g-card"><div class="g-ph" style="background-image:url('/assets/${img}.webp')"></div><div class="g-body"><h5>${t}</h5><p>${s}</p></div></div>`).join('')}
      </div>` },
    { code: 'G02', name: 'Edge-bleed peek',
      desc: "Wider cards where the next one peeks in from the edge, signalling there's more to swipe. Good for storytelling imagery.",
      html: `
      <div class="demo-scroll peek">
        ${[['gallery-06','Alfie James','28th March 2024'],['gallery-07','Baby Rose','12th May 2024'],['gallery-08','Little Theo','3rd June 2024'],['gallery-09','Baby Isla','19th July 2024']]
          .map(([img,t,s])=>`<div class="g-card"><div class="g-ph" style="background-image:url('/assets/${img}.webp')"></div><div class="g-body"><h5>${t}</h5><p>${s}</p></div></div>`).join('')}
      </div>` },
    { code: 'G03', name: 'Auto marquee',
      desc: 'A slow, continuous ticker that never stops. Best for press mentions, trust lines or a run of short phrases.',
      html: `
      <div class="demo-marquee">
        <div class="demo-marquee-track">
          ${Array(2).fill('<span>As seen in Mother &amp; Baby</span><span>&bull;</span><span>10,000+ kits sold</span><span>&bull;</span><span>Rated Excellent</span><span>&bull;</span><span>Made in Britain</span><span>&bull;</span>').join('')}
        </div>
      </div>` },
    { code: 'G04', name: 'Filmstrip thumbnails',
      desc: 'A large lead image with a strip of selectable thumbnails beneath. For product galleries and before/after sets.',
      html: `
      <div class="demo-pad">
        <div class="demo-filmstrip">
          <div class="fs-lead" style="background-image:url('/assets/gallery-10.webp')"></div>
          <div class="fs-thumbs">
            ${['gallery-10','gallery-11','gallery-12','gallery-13'].map((img,i)=>`<div class="fs-thumb${i===0?' is-active':''}" style="background-image:url('/assets/${img}.webp')"></div>`).join('')}
          </div>
        </div>
      </div>` },
  ],

  /* ============ BODY LAYOUTS ============ */
  body: [
    { code: 'B01', name: 'Split media & copy',
      desc: 'Image one side, words the other. The bread-and-butter block for explaining a single idea.',
      html: `
      <div class="demo-pad"><div class="demo-split">
        <div class="d-media" style="background-image:url('/assets/ff-process-800.webp')"></div>
        <div><p class="eyebrow">Foil Fusion Technology</p><h4>Real foil, not ink</h4>
        <p>Our exclusive process preserves your baby's prints in genuine metallic foil, so the detail stays crisp and mess-free for a lifetime.</p></div>
      </div></div>` },
    { code: 'B02', name: 'Centred statement',
      desc: 'A single centred idea with room to breathe, with the option of a handwritten accent word. Good for section intros.',
      html: `
      <div class="demo-pad"><div class="demo-centre">
        <p class="eyebrow">Why parents choose us</p>
        <h4>Tiny hands and feet, kept <span class="script">forever.</span></h4>
        <p>A keepsake you'll treasure long after those first prints have grown. Simple to make at home, flawless every time.</p>
      </div></div>` },
    { code: 'B03', name: 'Feature tile grid',
      desc: 'Three or more cards in a row, each with an image or icon, title and blurb. For tools, benefits or ranges.',
      html: `
      <div class="demo-pad"><div class="demo-tiles">
        ${[['card-shop-800','Order your kit','Delivered to your door in a few days.'],['card-tech-800','Take the prints','Mess-free foil, no ink, no fuss.'],['card-faq-800','Send them back','We frame and return your keepsake.']]
          .map(([img,t,p])=>`<div class="d-tile"><div class="d-tile-img" style="background-image:url('/assets/${img}.webp')"></div><h5>${t}</h5><p>${p}</p></div>`).join('')}
      </div></div>` },
    { code: 'B04', name: 'Alternating rows',
      desc: 'Media and copy that flip sides down the page. For walking through several points in sequence.',
      html: `
      <div class="demo-pad"><div class="demo-alt">
        <div class="d-row"><div class="d-media" style="background-image:url('/assets/inc-framed-hr.webp')"></div>
          <div><h5>Choose your frame</h5><p>Premium mounts in a range of finishes to suit any nursery or wall.</p></div></div>
        <div class="d-row"><div class="d-media" style="background-image:url('/assets/inc-foil-hr.webp')"></div>
          <div><h5>Personalise it</h5><p>Add your baby's name and date in our handwritten foil script.</p></div></div>
      </div></div>` },
    { code: 'B05', name: 'Stat band',
      desc: 'A dark band of headline numbers. For proof points - kits sold, ratings, years in business.',
      dark: false,
      html: `
      <div class="demo-pad"><div class="demo-stats">
        ${[['10k+','Kits sold'],['4.9','Trustpilot score'],['2017','Making memories since']]
          .map(([n,l])=>`<div class="d-stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('')}
      </div></div>` },
    { code: 'B06', name: 'Full-bleed image band',
      desc: 'An edge-to-edge photograph with an optional overlaid line. For emotional punctuation between sections.',
      html: `
      <div class="demo-bleed" style="background-image:url('/assets/hero-196-1200.webp')">
        <div class="demo-bleed-copy"><h4>Made to be treasured</h4></div>
      </div>` },
    { code: 'B07', name: 'Numbered steps',
      desc: 'A vertical or horizontal how-it-works sequence with big numerals. For processes and instructions.',
      html: `
      <div class="demo-pad"><div class="demo-steps">
        ${[['1','Order','Your kit arrives in days.'],['2','Print','Press tiny hands into foil.'],['3','Return','Post it back to us.'],['4','Treasure','We frame and send it home.']]
          .map(([n,t,p])=>`<div class="d-step"><div class="s-n">${n}</div><h5>${t}</h5><p>${p}</p></div>`).join('')}
      </div></div>` },
  ],

  /* ============ CTA BANDS ============ */
  cta: [
    { code: 'CTA01', name: 'Dark centred prompt',
      desc: 'A dark band with a single headline and one button. The standard pre-footer call to action.',
      dark: true,
      html: `
      <div class="demo-ctaband dark"><div class="cb-inner">
        <h4>Ready to capture theirs?</h4>
        <p>Order your kit today and keep those tiny prints forever.</p>
        <span class="demo-btn light">Order Your Kit ${arrowSvg}</span>
      </div></div>` },
    { code: 'CTA02', name: 'Split image prompt',
      desc: 'Copy and button on one side, a supporting photo on the other. Warmer, more product-led.',
      html: `
      <div class="demo-ctasplit">
        <div class="cs-copy"><p class="eyebrow">The perfect gift</p><h4>A keepsake they'll never forget</h4>
        <p>Give the gift of memory with a Bespoke Foil kit.</p><span class="demo-btn dark">Shop Gift Kits ${arrowSvg}</span></div>
        <div class="cs-media" style="background-image:url('/assets/product-490-900.webp')"></div>
      </div>` },
    { code: 'CTA03', name: 'Inline strip',
      desc: 'A slim single-line band - short message left, button right. Low-key, for mid-page nudges.',
      html: `
      <div class="demo-pad"><div class="demo-ctastrip">
        <span>Not sure which kit is right for you?</span>
        <span class="demo-btn ghost">Take the quiz ${arrowSvg}</span>
      </div></div>` },
  ],

  /* ============ TESTIMONIALS ============ */
  testimonials: [
    { code: 'T01', name: 'Quote cards row',
      desc: 'Three testimonial cards side by side, each with a star rating, quote and named parent.',
      html: `
      <div class="demo-pad"><div class="demo-quotes">
        ${[['test-1-500','Sarah M.','The detail is incredible. I cried when it arrived.'],['test-2-500','James & Kate','Beautiful keepsake of our little one. So easy to do.'],['test-3-500','Priya R.','Better than I ever imagined. A forever treasure.']]
          .map(([img,n,q])=>`<div class="q-card"><div class="q-stars">${'&#9733;'.repeat(5)}</div><p class="q-text">"${q}"</p><div class="q-person"><span class="q-av" style="background-image:url('/assets/${img}.webp')"></span><span class="q-name">${n}</span></div></div>`).join('')}
      </div></div>` },
    { code: 'T02', name: 'Feature quote',
      desc: 'One large pull-quote with the parent photo alongside. For a single powerful story.',
      html: `
      <div class="demo-pad"><div class="demo-featquote">
        <div class="fq-media" style="background-image:url('/assets/story-family-800.webp')"></div>
        <div class="fq-copy"><div class="q-stars">${'&#9733;'.repeat(5)}</div>
          <blockquote>"We'll have this on our wall forever. It captures a moment that's already gone by so fast."</blockquote>
          <cite>Emma, mum to Alfie</cite>
        </div>
      </div></div>` },
    { code: 'T03', name: 'Trustpilot strip',
      desc: 'A compact rating summary bar - score, stars and review count. For headers and pre-footer trust.',
      html: `
      <div class="demo-pad"><div class="demo-tpstrip">
        <span class="tp-score">4.9</span>
        <span class="q-stars tp">${'&#9733;'.repeat(5)}</span>
        <span class="tp-meta">TrustScore &bull; 600+ reviews on Trustpilot</span>
      </div></div>` },
  ],

  /* ============ PRICING ============ */
  pricing: [
    { code: 'P01', name: 'Three-tier cards',
      desc: 'Three plans side by side with a highlighted middle tier. The classic pricing layout.',
      html: `
      <div class="demo-pad"><div class="demo-pricing">
        ${[['Foil Kit','&pound;39','Everything to take the prints at home.',false],['Framed Keepsake','&pound;89','Your prints, professionally framed.',true],['Premium Set','&pound;149','Twin frame, gift box and add-ons.',false]]
          .map(([t,p,d,feat])=>`<div class="pr-card${feat?' is-feat':''}">${feat?'<span class="pr-tag">Most loved</span>':''}<h5>${t}</h5><div class="pr-price">${p}</div><p>${d}</p><span class="demo-btn ${feat?'dark':'ghost'}">Choose</span></div>`).join('')}
      </div></div>` },
    { code: 'P02', name: 'Comparison table',
      desc: 'A feature-by-feature grid across plans. For when the differences matter more than the price.',
      html: `
      <div class="demo-pad"><table class="demo-cmp">
        <thead><tr><th></th><th>Kit</th><th>Framed</th><th>Premium</th></tr></thead>
        <tbody>
          ${[['Foil prints','&#10003;','&#10003;','&#10003;'],['Professional frame','','&#10003;','&#10003;'],['Twin mount','','','&#10003;'],['Gift box','','','&#10003;']]
            .map(([f,a,b,c])=>`<tr><td>${f}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}
        </tbody>
      </table></div>` },
  ],

  /* ============ FAQ ============ */
  faq: [
    { code: 'F01', name: 'Single-column accordion',
      desc: 'Stacked questions that expand on tap. The default for FAQ pages and product detail.',
      html: `
      <div class="demo-pad"><div class="demo-faq">
        ${[['How long does the foil last?','It never fades - the prints are sealed in real metallic foil, made to last a lifetime.',true],['Is it safe for newborns?','Completely. The process is mess-free, non-toxic and gentle on the most delicate skin.',false],['How soon will I get it back?','Framed keepsakes are returned within 10 working days of us receiving your prints.',false]]
          .map(([q,a,open])=>`<div class="fa-item${open?' open':''}"><button class="fa-q">${q}<span class="fa-ic">${open?'&minus;':'+'}</span></button><div class="fa-a">${a}</div></div>`).join('')}
      </div></div>` },
    { code: 'F02', name: 'Two-column grid',
      desc: 'Questions in two columns for shorter answers. Fits more above the fold.',
      html: `
      <div class="demo-pad"><div class="demo-faqgrid">
        ${[['Do you ship UK-wide?','Yes, free on all kits.'],['Can I add a name?','Every keepsake can be personalised.'],['What if it smudges?','Our print-quality guarantee has you covered.'],['Do you do twins?','Absolutely - ask about our twin mount.']]
          .map(([q,a])=>`<div class="fg-item"><h5>${q}</h5><p>${a}</p></div>`).join('')}
      </div></div>` },
  ],

  /* ============ FORMS ============ */
  forms: [
    { code: 'FORM01', name: 'Inline email capture',
      desc: 'A single-line email field and button. For newsletter and community sign-ups.',
      html: `
      <div class="demo-pad"><div class="demo-emailcap">
        <div><h4>Join our community</h4><p>10% off your first order as a welcome gift.</p></div>
        <div class="ec-form"><input placeholder="Email address*"><span class="demo-btn dark">Join</span></div>
      </div></div>` },
    { code: 'FORM02', name: 'Stacked enquiry form',
      desc: 'Name, email and message stacked in a card. For contact and franchise enquiries.',
      html: `
      <div class="demo-pad"><div class="demo-enquiry">
        <p class="eyebrow">Get in touch</p><h4>Send us a message</h4>
        <div class="eq-field"><label>Name</label><input placeholder="Your name"></div>
        <div class="eq-field"><label>Email</label><input placeholder="you@example.com"></div>
        <div class="eq-field"><label>Message</label><textarea placeholder="How can we help?"></textarea></div>
        <span class="demo-btn dark">Send message ${arrowSvg}</span>
      </div></div>` },
  ],

  /* ============ FOOTERS ============ */
  footers: [
    { code: 'FT01', name: 'Full four-column',
      desc: 'The main site footer - contact, explore, resources and franchise columns with trust and legal.',
      html: `
      <div class="demo-footer">
        <div class="df-cols">
          ${[['Contact','Tel: 07506 998934|hello@thebespokefoilcompany.co.uk|Wigan, WN3 4AL'],['Explore','Order Your Kit|Our Story|Premium Frames|Foil Fusion'],['Resources','FAQ|Stories|Gallery|Walkthrough'],['Franchise','Franchise Hub|Memory Catcher Hub|Earnings Calculator|Regional Map']]
            .map(([h,items])=>`<div class="df-col"><h6>${h}</h6>${items.split('|').map(i=>`<span>${i}</span>`).join('')}</div>`).join('')}
        </div>
        <div class="df-legal"><span>&copy; 2026 The Bespoke Foil Company</span><span class="q-stars tp">${'&#9733;'.repeat(5)} 4.9</span></div>
      </div>` },
    { code: 'FT02', name: 'Slim centred',
      desc: 'A compact single-row footer - logo, a few links and legal. For landing and campaign pages.',
      html: `
      <div class="demo-footer slim">
        <div class="dfs-logo">Bespoke Foil Company</div>
        <div class="dfs-links"><span>Order</span><span>Story</span><span>FAQ</span><span>Contact</span></div>
        <div class="dfs-legal">&copy; 2026 BFC &bull; Privacy</div>
      </div>` },
  ],

};

module.exports = { CATEGORIES, COMPONENTS };
