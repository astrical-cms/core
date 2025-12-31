# Strategic Site Design (For AI)

This section provides a strategic framework for translating a user's request for a new website or a set of pages into a concrete content structure using the available layouts and components.

## Deconstructing a Site Idea

When a user provides a concept for a website (e.g., "a marketing site for a new SaaS product"), the first step is to outline the necessary pages. A typical marketing site includes:

1.  **Home Page (`home.yaml`)**: The main landing page. Its goal is to grab attention, communicate the core value proposition, and direct users to other key areas of the site.
2.  **About Page (`about.yaml`)**: Tells the story of the company, its mission, and its team. Builds trust and connection.
3.  **Services/Product Pages (`services.yaml`, `product-a.yaml`)**: Detailed pages explaining what is offered. Each major service or product might get its own page.
4.  **Pricing Page (`pricing.yaml`)**: Clearly lays out the costs and features of different plans.
5.  **Contact Page (`contact.yaml`)**: Provides a way for users to get in touch, usually with a form and contact details.
6.  **Blog/Resources Pages**: For content marketing. These are often managed separately or follow a different template.

For each page, determine its primary goal and the key information it needs to convey. This will inform which components to use.

## Process for Generating a Site Outline

To systematically convert a website idea into an actionable plan, follow these steps. The output of this process should be a clear site outline that you confirm with the user before creating any files.

1.  **Analyze the Core Request**:
    - **Identify the Subject**: What is the website about? (e.g., a law firm, a SaaS product, a personal portfolio).
    - **Identify the Goal**: What is the primary action the user wants visitors to take? (e.g., book a consultation, sign up for a trial, view a portfolio).
    - **Identify the Target Audience**: Who is the website for? (e.g., enterprise clients, small businesses, creative professionals).

2.  **Draft a Page List**:
    - **Start with Standard Pages**: Almost every site needs a Home, About, and Contact page.
    - **Add Content-Specific Pages**: Based on the subject, add relevant pages.
        - For a SaaS product: "Features", "Pricing", "Integrations".
        - For a service business (like a law firm): "Services", "Our Team", "Case Studies".
        - For a portfolio: "Portfolio", "Resume".
    - **Propose a Filename for Each Page**: Use short, descriptive slugs (e.g., `home.yaml`, `about-us.yaml`, `contact.yaml`).

3.  **Define Page-by-Page Objectives and Components**:
    - For each page in your list, create a brief outline.
    - **Objective**: State the page's primary goal in one sentence.
    - **Key Components**: List the essential components needed to achieve that goal. Use the component names from this guide (e.g., `Hero`, `Features`, `Testimonials`, `Form`).

4.  **Construct the Site Outline for User Approval**:
    - Format the information from the previous steps into a clear, hierarchical list. This is the "Site Outline" you will present to the user.

### Example Site Outline Generation

**User Request**: "I need a website for my new AI consulting business, 'Innovate AI'. We help companies build custom AI solutions. I want to showcase our services, our past projects, and get new clients to contact us."

**AI's Internal Analysis**:
- **Subject**: AI consulting business.
- **Goal**: Get potential clients to make contact.
- **Audience**: Businesses looking for AI solutions.

**AI's Proposed Site Outline (to be shown to the user)**:

Here is the proposed page outline for your website. Please review and confirm before I begin creating the pages.

- **1. Home (`home.yaml`)**
  - **Objective**: To quickly communicate what Innovate AI does and guide visitors to learn more or make contact.
  - **Key Components**:
    - A `Hero` section to state the main value proposition.
    - A `Features` grid to briefly list key services (e.g., "Strategy", "Development", "Integration").
    - A `Testimonials` section for social proof.
    - A `CallToAction` to encourage users to contact you.

- **2. Services (`services.yaml`)**
  - **Objective**: To provide detailed information about each of Innovate AI's service offerings.
  - **Key Components**:
    - A `HeroText` to introduce the services.
    - Multiple `Content` sections (one for each service) with text and possibly an icon or image.
    - An `FAQs` section to answer common questions about the services.

- **3. Case Studies (`case-studies.yaml`)**
  - **Objective**: To build credibility by showcasing successful past projects.
  - **Key Components**:
    - A `HeroText` introducing the portfolio.
    - A grid of case studies, likely using `Features` or `Content` components, where each item links to a detailed (future) case study page.

- **4. About Us (`about.yaml`)**
  - **Objective**: To tell the story of Innovate AI and build trust with potential clients.
  - **Key Components**:
    - A `Content` section with the company's mission and story.
    - A `Features` grid to introduce key team members with photos and bios.
    - A `Stats` section with company achievements (e.g., "10+ Years Experience").

- **5. Contact (`contact.yaml`)**
  - **Objective**: To make it easy for potential clients to get in touch.
  - **Key Components**:
    - A `Form` component for inquiries.
    - A `Content` section with other contact details (email, phone number).

This structured outline ensures clarity and alignment before any development work begins.

## Choosing Section Layouts

Section layouts define the high-level structure of a horizontal slice of a page.

- **`SingleColumn`**:
  - **Use Case**: Best for focused, full-width content that should draw the user's attention without distraction.
  - **Good for**:
    - Hero sections (using `HeroText`, `Hero`).
    - Centered, simple text blocks (`Content` component without an image).
