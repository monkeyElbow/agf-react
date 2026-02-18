import { useEffect, useMemo, useRef, useState } from 'react';
import { pageByPath } from '../data/siteMap';
import useWpEnhancements from '../hooks/useWpEnhancements';
import { extractWpContentHtml, sanitizeWpCss } from '../utils/wpRender';
import '../styles/wp-additional.css';

function wpContentKey(path) {
  if (path === '/') {
    return 'home';
  }
  return path.replace(/^\//, '').replace(/\//g, '__');
}

export default function WpContentPage({ path }) {
  const page = pageByPath[path];
  const [content, setContent] = useState(null);
  const pageCss = useMemo(() => sanitizeWpCss(content?.css), [content?.css]);
  const pageHtml = useMemo(() => extractWpContentHtml(content?.html), [content?.html]);
  const shellRef = useRef(null);

  useWpEnhancements(shellRef, pageHtml);

  useEffect(() => {
    let isMounted = true;
    const key = wpContentKey(path);

    fetch(`/wp-content/${key}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!isMounted) {
          return;
        }
        setContent(payload);
      })
      .catch(() => {
        if (isMounted) {
          setContent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [path]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    shell.querySelectorAll('.section-full').forEach((el) => el.classList.remove('section-full'));
    shell.querySelectorAll('.content').forEach((el) => el.classList.remove('content'));
    shell.querySelectorAll('.content-wide').forEach((el) => el.classList.remove('content-wide'));
    shell.querySelectorAll('.hero').forEach((el) => el.classList.remove('hero'));

    shell.querySelectorAll('.wp-block-cover').forEach((cover) => {
      cover.classList.add('section-full');
      const inner = cover.querySelector(':scope > .wp-block-cover__inner-container');
      inner?.classList.add('content');
    });

    const pageHeader = shell.querySelector('header.page-header');
    if (pageHeader) {
      pageHeader.classList.add('hero');
      pageHeader.classList.add('ag-hero');
      pageHeader.classList.add('section-full');
      pageHeader.querySelector('.page-header-inner')?.classList.add('content');
      return;
    }

    const covers = Array.from(shell.querySelectorAll('.wp-block-cover'));
    if (!covers.length) {
      return;
    }

    const heroCover = covers[0];
    heroCover.classList.add('hero');
    heroCover.classList.add('ag-hero');
  }, [path, pageHtml]);

  if (!page) {
    return null;
  }

  if (!content) {
    return (
      <div className="wp-page-wrap" data-path={path}>
        <div className="wp-content-shell wp-content-loading" />
      </div>
    );
  }

  return (
    <div className="wp-page-wrap" data-path={path}>
      {pageCss ? <style dangerouslySetInnerHTML={{ __html: pageCss }} /> : null}
      <div ref={shellRef} className="wp-content-shell" dangerouslySetInnerHTML={{ __html: pageHtml }} />
    </div>
  );
}
