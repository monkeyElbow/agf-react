import { createSanitizedHtmlMarkup } from '../lib/safeHtml';

export default function SafeRichText({
  as: Component = 'div',
  html = '',
  ...rest
}) {
  return <Component {...rest} dangerouslySetInnerHTML={createSanitizedHtmlMarkup(html)} />;
}
