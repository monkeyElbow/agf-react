import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResourcesProvider, useResources } from './ResourcesContext';

function WorkflowProbe() {
  const {
    articles,
    publishedArticles,
    updateArticle,
    saveArticle,
    publishArticle,
    scheduleArticle,
    getArticleStatus,
  } = useResources();
  const article = articles[0];
  const liveArticle = publishedArticles.find((item) => item.id === article?.id);

  if (!article) {
    return null;
  }

  return (
    <div>
      <output data-testid="draft-title">{article.title}</output>
      <output data-testid="live-title">{liveArticle?.title || ''}</output>
      <output data-testid="status">{getArticleStatus(article)}</output>
      <button type="button" onClick={() => updateArticle(article.id, { title: 'Draft title' })}>
        Edit draft
      </button>
      <button type="button" onClick={() => saveArticle(article.id)}>
        Save draft
      </button>
      <button type="button" onClick={() => publishArticle(article.id)}>
        Make live
      </button>
      <button
        type="button"
        onClick={() => scheduleArticle(article.id, new Date(Date.now() + 3600000).toISOString())}
      >
        Schedule
      </button>
    </div>
  );
}

describe('ResourcesContext publish workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps edits out of the public snapshot until Make live', () => {
    render(
      <ResourcesProvider>
        <WorkflowProbe />
      </ResourcesProvider>,
    );

    const originalTitle = screen.getByTestId('live-title').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Edit draft' }));

    expect(screen.getByTestId('draft-title').textContent).toBe('Draft title');
    expect(screen.getByTestId('live-title').textContent).toBe(originalTitle);
    expect(screen.getByTestId('status').textContent).toBe('draft');

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(screen.getByTestId('live-title').textContent).toBe(originalTitle);

    fireEvent.click(screen.getByRole('button', { name: 'Make live' }));
    expect(screen.getByTestId('live-title').textContent).toBe('Draft title');
    expect(screen.getByTestId('status').textContent).toBe('live');
  });

  it('marks a future publish as scheduled without changing live content', () => {
    render(
      <ResourcesProvider>
        <WorkflowProbe />
      </ResourcesProvider>,
    );

    const originalTitle = screen.getByTestId('live-title').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Edit draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(screen.getByTestId('status').textContent).toBe('scheduled');
    expect(screen.getByTestId('live-title').textContent).toBe(originalTitle);
  });
});
