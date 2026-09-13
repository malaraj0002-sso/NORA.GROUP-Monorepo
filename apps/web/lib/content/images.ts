/**

 * Local professional millwork / interior imagery.

 * Hosted in /public/images so the site never depends on remote CDNs.

 * Replace anytime via Sanity Studio uploads.

 */

const img = (file: string) => `/images/${file}`;



export const images = {

  kitchen1: img('hero-kitchen.jpg'),

  kitchen2: img('kitchen-white.jpg'),

  kitchen3: img('kitchen-walnut.jpg'),

  bedroom1: img('bedroom.jpg'),

  bedroom2: img('bedroom-2.jpg'),

  wardrobe1: img('wardrobe.jpg'),

  wardrobe2: img('wardrobe-2.jpg'),

  wardrobe3: img('wardrobe-2.jpg'),

  furniture1: img('furniture.jpg'),

  furniture2: img('furniture-2.jpg'),

  livingRoom1: img('living.jpg'),

  livingRoom2: img('furniture-2.jpg'),

  office1: img('office.jpg'),

  commercial1: img('commercial.jpg'),

  wood1: img('wood.jpg'),

  wood2: img('wood-oak.jpg'),

  wood3: img('wood-joinery.jpg'),

  craft1: img('craft.jpg'),

  hero1: img('hero-kitchen.jpg'),

  hero2: img('living.jpg'),

  hero3: img('hero-kitchen-2.jpg'),

};



/** Local cinematic loop for the homepage hero */

export const HERO_VIDEO_SRC = '/videos/hero.mp4';



export const HERO_VIDEO_POSTER = images.hero1;

