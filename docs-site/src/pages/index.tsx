import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/user-guide/overview">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/agent-developers/overview"
            style={{marginLeft: '1rem'}}>
            Build Agents
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">For Users</Heading>
              <p>
                Get started with Agentrix platform. Learn how to create tasks,
                manage your local executor, and integrate with GitHub/GitLab.
              </p>
              <Link to="/user-guide/overview">
                User Guide →
              </Link>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">For Agent Developers</Heading>
              <p>
                Build custom AI agents with our powerful hook system.
                Learn about agent structure, MCP servers, and best practices.
              </p>
              <Link to="/agent-developers/overview">
                Agent Dev Guide →
              </Link>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">API Reference</Heading>
              <p>
                Integrate with Agentrix APIs. Learn about REST endpoints,
                authentication, and request/response formats.
              </p>
              <Link to="/api-reference/overview">
                API Reference →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Enterprise AI Agent Hosting and Collaboration Platform">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
