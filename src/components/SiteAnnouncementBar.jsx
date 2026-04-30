import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { resolvePagePathFromRef } from '../data/siteMap';
import {
  announcementBackgroundSwatches,
  announcementTextColors,
  useAnnouncement,
} from '../context/AnnouncementContext';

export default function SiteAnnouncementBar() {
  const { announcement } = useAnnouncement();

  const styles = useMemo(() => {
    const background = announcementBackgroundSwatches.find((item) => item.id === announcement.backgroundId)
      || announcementBackgroundSwatches[0];
    const text = announcementTextColors.find((item) => item.id === announcement.textColorId)
      || announcementTextColors[0];

    return {
      backgroundColor: background.color,
      color: text.color,
    };
  }, [announcement.backgroundId, announcement.textColorId]);

  const message = String(announcement.message || '').trim();
  const linkTarget = announcement.linkEnabled
    ? resolvePagePathFromRef(announcement.linkPageRef, announcement.linkPath)
    : '';
  const today = new Date();
  const todayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const isAfterStart = !announcement.startDate || todayIso >= announcement.startDate;
  const isBeforeEnd = !announcement.endDate || todayIso <= announcement.endDate;
  const isInWindow = isAfterStart && isBeforeEnd;

  if (!announcement.enabled || !message || !isInWindow) {
    return null;
  }

  return (
    <section className="site-announcement-bar" style={styles} aria-label="Site message">
      <div className="ag-panel-rail">
        {linkTarget ? (
          <Link className="site-announcement-bar-link" to={linkTarget}>
            <p>{message}</p>
          </Link>
        ) : (
          <p>{message}</p>
        )}
      </div>
    </section>
  );
}
