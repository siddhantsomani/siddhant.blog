import { Github, Twitter } from "lucide-react"

export const defaultLanguage: string = "en"

export const common = {
  domain: "https://siddhant.blog",
  meta: {
    favicon: "/avatar.png",
    url: "https://siddhant.blog",
  },
  googleAnalyticsId: "",
  social: [
    {
      icon: Twitter,
      label: "X",
      link: "https://x.com/siddhantsomani",
    },
    {
      icon: Github,
      label: "GitHub",
      link: "https://github.com/siddhantsomani",
    },
  ],
  rss: true,
  navigation: {
    home: true,
    archive: true,
    links: true,
    about: true,
  },
  latestPosts: 8,
  comments: {
    enabled: true,
    twikoo: {
      enabled: true,
      // replace with your own envId
      envId: import.meta.env.PUBLIC_TWIKOO_ENV_ID ?? "",
    },
  },
}

export const en = {
  ...common,
  siteName: "Siddhant Somani",
  meta: {
    ...common.meta,
    title: "Siddhant Somani",
    slogan: "An apprentice forever",
    description: "Engineer, Programmer, Tinkerer.",
  },
  navigation: {
    ...common.navigation,
  },
  pageMeta: {
    archive: {
      title: "All Posts",
      description: "Here are Siddhant Somani's posts",
      ogImage: "/images/page-meta/en/archive.png",
    },
    about: {
      title: "About Me",
      description: "Here is Siddhant Somani's self-introduction",
      ogImage: "/images/page-meta/en/about.png",
    },
    links: {
      title: "Links",
      description: "My favorite links and resources",
      ogImage: "/images/page-meta/en/links.png",
    },
  },
}
