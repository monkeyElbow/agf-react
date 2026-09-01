import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import { pageByPath } from '../data/siteMap';
import { useContentAdmin } from '../context/ContentAdminContextCore';

function profileFormFrom(profile) {
  return {
    fullName: profile?.fullName || profile?.displayName || '',
    nickname: profile?.nickname || profile?.displayName || '',
    email: profile?.email || '',
    accentColor: profile?.accentColor || '#00adbb',
  };
}

export default function AdminProfilePage() {
  const {
    devIdentity = null,
    devAdminProfiles = [],
    selectDevAdminProfile = () => null,
    updateDevAdminProfile = () => null,
  } = useContentAdmin();
  const profiles = devAdminProfiles;
  const [selectedId, setSelectedId] = useState(devIdentity?.userId || profiles[0]?.userId || '');
  const selectedProfile = profiles.find((profile) => profile.userId === selectedId) || profiles[0] || null;
  const [form, setForm] = useState(() => profileFormFrom(selectedProfile));
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedProfile) {
      return;
    }
    setForm(profileFormFrom(selectedProfile));
  }, [selectedId, selectedProfile]);

  const chooseProfile = (profile) => {
    if (!profile) {
      return;
    }
    selectDevAdminProfile(profile.userId);
    setSelectedId(profile.userId);
    setMessage(`${profile.nickname || profile.displayName} is active in this browser.`);
  };

  const saveProfile = () => {
    if (!selectedProfile) {
      return;
    }
    const nextProfile = updateDevAdminProfile(selectedProfile.userId, form);
    setMessage(nextProfile ? 'Admin profile saved in development settings.' : 'Admin profile could not be saved.');
  };

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell title="Admin: Profile" source={pageByPath['/admin/profile']?.source ?? null} showBadge={false}>
        <div className="admin-profile-intro">
          <p className="admin-resources-eyebrow">Development admin profile</p>
          <h2>Choose who you are testing as</h2>
          <p>
            These temporary profiles make ownership, draft, and saved-by workflows readable across test browsers. They are not logins or security permissions.
          </p>
        </div>

        <section className="admin-content-section admin-profile-section">
          <div className="admin-profile-picker" role="list" aria-label="Temporary admin profiles">
            {profiles.map((profile) => {
              const isActive = profile.userId === devIdentity?.userId;
              const isSelected = profile.userId === selectedProfile?.userId;
              return (
                <button
                  key={profile.userId}
                  type="button"
                  className={`admin-profile-card${isSelected ? ' is-selected' : ''}`}
                  onClick={() => chooseProfile(profile)}
                  aria-pressed={isSelected}
                >
                  <span className="admin-profile-avatar" style={{ backgroundColor: profile.accentColor }}>
                    {profile.initials}
                  </span>
                  <span className="admin-profile-card-copy">
                    <strong>{profile.nickname || profile.displayName}</strong>
                    <small>{profile.fullName}</small>
                  </span>
                  <span className={`admin-profile-active-state${isActive ? ' is-active' : ''}`}>
                    {isActive ? 'Active here' : 'Switch'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedProfile ? (
          <section className="admin-content-section admin-profile-section">
            <div className="admin-profile-editor-heading">
              <div>
                <p className="admin-resources-eyebrow">Profile details</p>
                <h2>{selectedProfile.nickname || selectedProfile.displayName}</h2>
              </div>
              <span className="admin-profile-id">{selectedProfile.userId}</span>
            </div>

            <div className="admin-content-field-list admin-profile-fields">
              <div className="admin-content-grid-two">
                <label>
                  <span>Full name</span>
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Nickname shown in badges</span>
                  <input
                    value={form.nickname}
                    onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
                  />
                </label>
              </div>

              <div className="admin-content-grid-two">
                <label>
                  <span>Email (development profile only)</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="admin-profile-color-field">
                  <span>Accent color</span>
                  <span className="admin-profile-color-control">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))}
                    />
                    <code>{form.accentColor}</code>
                  </span>
                </label>
              </div>

              <div className="admin-actions admin-profile-actions">
                <button type="button" className="action-btn action-btn-primary" onClick={saveProfile}>
                  Save profile
                </button>
                {selectedProfile.userId !== devIdentity?.userId ? (
                  <button type="button" className="action-btn action-btn-outline" onClick={() => chooseProfile(selectedProfile)}>
                    Use this admin in this browser
                  </button>
                ) : null}
                {message ? <span className="admin-profile-message" role="status">{message}</span> : null}
              </div>
            </div>
          </section>
        ) : null}
      </PageShell>
    </div>
  );
}
