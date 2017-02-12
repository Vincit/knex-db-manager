import React from 'react'
import { Link } from 'react-router'
import { Sticky, StickyContainer } from 'react-sticky'
import Sidebar from 'react-sidebar';

import { prefixLink } from 'gatsby-helpers'
import includes from 'underscore.string/include'
import { colors, activeColors } from 'utils/colors'

import typography from 'utils/typography'
import { config } from 'config'

const hljs = require('highlight.js');

// Import styles.
import 'css/main.css'
import 'css/github.css'

const { rhythm, adjustFontSizeTo } = typography

const styles = {
  sidebar: {
    width: 256,
    height: '100%',
  },
  sidebarLink: {
    display: 'block',
    paddingBottom: '5px',
    color: '#757575',
    textDecoration: 'none',
  },
  divider: {
    margin: '8px 0',
    height: 1,
    backgroundColor: '#757575',
  },
  content: {
    padding: '16px',
    height: '100%',
    backgroundColor: 'white',
  },
};

module.exports = React.createClass({
  propTypes () {
    return {
      children: React.PropTypes.object,
    }
  },

  getInitialState() {
    return {sidebarOpen: false, sidebarDocked: false};
  },

  onSetSidebarOpen(open) {
    this.setState({sidebarOpen: open});
  },

  componentWillMount() {
    if (typeof window !== 'undefined') {
      var mql = window.matchMedia(`(min-width: 800px)`);
      mql.addListener(this.mediaQueryChanged);
      this.setState({mql: mql, sidebarDocked: mql.matches});
    }
  },

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged);
  },

  mediaQueryChanged() {
    this.setState({
      sidebarDocked: this.state.mql.matches,
      sidebarOpen: false
    });
  },

  toggleOpen() {
    const shouldBeOpen = this.state.sidebarDocked || !this.state.sidebarOpen;
    this.setState({sidebarOpen: shouldBeOpen})
  },

  render () {
    const docsActive = includes(this.props.location.pathname, '/docs/')

    const sideMenuItems = this.props.route.indexRoute.page.data.toc
      .filter(i => !!i.anchor).map((child) => {
        let header = child.headerText;
        // <span><small>{returnValue}</small><br/>{rest}</span>
        if (child.headerText[0] === '`') {
          const clean = child.headerText.replace(/`/g, '');
          const startOfRetval = clean.lastIndexOf(':');
          const returnValue = clean.substr(startOfRetval+1);
          const rest = clean.substr(0, startOfRetval);

          header =
            <span className="code">
              <div dangerouslySetInnerHTML={{ __html:
              hljs.highlight('typescript', returnValue).value }} />
              <div dangerouslySetInnerHTML={{ __html:
              hljs.highlight('typescript', rest).value }} />
            </span>
        }
        return (
          <div className={'menu-item level-' + child.level} key={child.anchor}>
            <Link
              to={{ pathname: '/', hash: '#' + (child.anchor || child.headerText)}}
              className="menu-link"
              onClick={this.toggleOpen}
            >
              {header}
            </Link>
          </div>
        );
      });

    const sideMenu = (
      <div className="side-menu">
        <div className="menu-item">
          <a href="https://github.com/Vincit/knex-db-manager" className="menu-link">Github</a>
        </div>
        <div className="menu-item">
          <Link
            to="/changelog/"
            className="menu-link"
            onClick={this.toggleOpen}
          >
          Changelog
          </Link>
        </div>
        <div style={styles.divider} />
        {sideMenuItems}
      </div>
    );

    const headerContent = (
      <span className="content">
        {!this.state.sidebarDocked &&
         <a onClick={this.toggleOpen} href="#" className="menu-btn">=</a>}
        <Link
          to={this.state.sidebarDocked ? '/' : undefined}
          onClick={this.toggleOpen}
          className="text"
        >
          knex-db-manager
        </Link>
      </span>
    );

    return (
      <div>
        <div className="header-bar">
          <h1>{headerContent}</h1>
        </div>

        <div className="content-area">
          <Sidebar
            sidebar={sideMenu}
            open={this.state.sidebarOpen}
            docked={this.state.sidebarDocked}
            onSetOpen={this.onSetSidebarOpen}
          >
            <div className="main-content">
              {this.props.children}
            </div>
          </Sidebar>
        </div>
      </div>
    )
  },
})
