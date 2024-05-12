import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Codedang 코드당',
  description: '코드당 프로젝트의 거의 모든 것을 담은 문서',
  titleTemplate: false,
  lastUpdated: true,

  sitemap: {
    hostname: 'https://docs.codedang.com'
  },

  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/logo.png'
      }
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        as: 'style',
        crossorigin: '',
        href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
      }
    ]
  ],

  themeConfig: {
    logo: '/logo.png',
    search: {
      provider: 'local',
      options: {
        detailedView: true
      }
    },
    nav: [
      {
        text: 'For Developers',
        link: '/dev/intro/'
      },
      {
        text: 'For Users',
        link: '/user/login'
      },
      {
        text: 'Codedang',
        link: 'https://codedang.com'
      }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/skkuding/next' }],
    sidebar: {
      '/dev/': [
        {
          text: 'Introduction',
          items: [
            {
              text: '코드당이 뭔가요?',
              link: '/dev/intro/'
            },
            {
              text: '시작하기',
              link: '/dev/intro/getting-started'
            },
            {
              text: 'Contributing Guide',
              link: 'https://github.com/skkuding/next/blob/main/CONTRIBUTING.md'
            },
            {
              text: 'API 문서 (Bruno)',
              link: '/dev/intro/bruno'
            }
          ]
        },
        {
          text: 'Project',
          items: [
            {
              text: '기술 스택',
              link: '/dev/project/tech-stack'
            },
            {
              text: '프로젝트 구조',
              link: '/dev/project/hierarchy'
            },
            {
              text: '배포 과정',
              link: '/dev/project/deploy'
            },
            {
              text: 'Staging vs Production',
              link: '/dev/project/stage-server'
            },
            {
              text: 'Project Roadmap',
              link: '/dev/project/roadmap'
            }
          ]
        }
      ],
      '/user/': [
        {
          text: '관리자',
          items: [
            {
              text: '가입 및 로그인',
              link: '/user/login'
            },
            {
              text: '그룹 및 멤버 관리',
              link: '/user/group'
            },
            {
              text: '문제 생성 및 관리',
              link: '/user/problem'
            }
          ]
        }
      ]
    }
  },
  vite: {
    server: {
      host: true
    }
  }
})
