import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Agentrix',
  tagline: 'Enterprise AI Agent Hosting and Collaboration Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://xmz-ai.github.io',
  baseUrl: '/agentrix/',

  organizationName: 'xmz-ai',
  projectName: 'agentrix',

  onBrokenLinks: 'warn',
  markdown: {
    format: 'mdx',
    mermaid: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
      },
      zh: {
        label: '中文',
        direction: 'ltr',
        htmlLang: 'zh-CN',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: undefined, // Disable edit links
          sidebarCollapsible: true,
          sidebarCollapsed: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/agentrix-social-card.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Agentrix',
      logo: {
        alt: 'Agentrix Logo',
        src: 'img/logo.png',
        srcDark: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'userGuideSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'agentDevelopersSidebar',
          position: 'left',
          label: 'Agent Developers',
        },
        {
          type: 'docSidebar',
          sidebarId: 'platformDevelopersSidebar',
          position: 'left',
          label: 'Platform Developers',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/xmz-ai/agentrix',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'User Guide',
              to: '/user-guide/cli-setup-dependencies',
            },
            {
              label: 'Agent Developers',
              to: '/agent-developers/getting-started',
            },
            {
              label: 'Platform Developers',
              to: '/platform-developers/DEPLOYMENT',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/xmz-ai/agentrix',
            },
            {
              label: 'Website',
              href: 'https://agentrix.xmz.ai',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Agentrix. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'javascript', 'json', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
