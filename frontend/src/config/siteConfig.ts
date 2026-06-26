export const siteConfig = {
  name: "Ecomm",
  description: "Your one stop online store",
  mainNav: [
    {
      title: "Rice & Grains",
      items: [
        {
          title: "All Rice & Grains",
          href: "/products/rice-grains",
          description: "Basmati, jasmine, taichin and more",
        },
        {
          title: "Basmati Rice",
          href: "/products/rice-grains/basmati",
          description: "Premium long-grain basmati varieties",
        },
        {
          title: "Beaten Rice (Chiura)",
          href: "/products/rice-grains/chiura",
          description: "Taichin, pahadi and terai chiura",
        },
        {
          title: "Flour",
          href: "/products/rice-grains/flour",
          description: "Atta, maida, millet, buckwheat and more",
        },
      ],
    },
    {
      title: "Lentils & Spices",
      items: [
        {
          title: "All Lentils & Beans",
          href: "/products/lentils-beans",
          description: "Dal, chick peas, kidney beans and more",
        },
        {
          title: "Spices & Masala",
          href: "/products/spices",
          description: "Whole and ground spices, masala blends",
        },
        {
          title: "Oil & Ghee",
          href: "/products/oil-ghee",
          description: "Mustard oil, cow ghee and cooking oils",
        },
      ],
    },
    {
      title: "Snacks & Drinks",
      items: [
        {
          title: "Noodles",
          href: "/products/noodles",
          description: "Wai Wai, Rara, Nongshim and more",
        },
        {
          title: "Biscuits & Cookies",
          href: "/products/biscuits",
          description: "Britannia, Parle, Lotte and more",
        },
        {
          title: "Confectionery",
          href: "/products/confectionery",
          description: "Candies, chocolates and sweets",
        },
        {
          title: "Dairy",
          href: "/products/dairy",
          description: "Milk, yoghurt, paneer, juju dhau",
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          title: "Our Store",
          href: "/about",
          description: "Who we are and where to find us",
        },
        {
          title: "Contact Us",
          href: "/contact",
          description: "Get in touch with our team",
        },
      ],
    },
  ],
  footerNav: [
    {
      title: "Shop",
      items: [
        {
          title: "Rice & Grains",
          href: "/products/rice-grains",
          description: "",
        },
        {
          title: "Lentils & Beans",
          href: "/products/lentils-beans",
          description: "",
        },
        { title: "Spices & Masala", href: "/products/spices", description: "" },
        { title: "Oil & Ghee", href: "/products/oil-ghee", description: "" },
        { title: "Noodles", href: "/products/noodles", description: "" },
        {
          title: "Biscuits & Cookies",
          href: "/products/biscuits",
          description: "",
        },
        { title: "Dairy", href: "/products/dairy", description: "" },
      ],
    },
    {
      title: "Company",
      items: [
        { title: "About Us", href: "/about", description: "" },
        { title: "Contact", href: "/contact", description: "" },
      ],
    },
    {
      title: "Legal",
      items: [
        { title: "Privacy Policy", href: "/privacy", description: "" },
        { title: "Terms of Service", href: "/terms", description: "" },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
export type NavItem = { title: string; href: string; description: string };
export type NavGroup = { title: string; items: NavItem[] };
