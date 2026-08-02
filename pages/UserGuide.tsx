
import React from 'react';

const GUIDE_URL = 'https://claude.ai/code/artifact/c9e2f12f-19c5-4505-9c3c-a44867959b75';

const UserGuide: React.FC = () => (
  <div className="-mx-8 -mt-16 lg:-mt-8 -mb-8" style={{ height: '100vh' }}>
    <iframe
      src={GUIDE_URL}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Staff Portal Guide"
    />
  </div>
);

export default UserGuide;
