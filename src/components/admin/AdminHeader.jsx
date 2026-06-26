import React from 'react';
import { MdSearch, MdNotificationsNone, MdOutlineSettings } from 'react-icons/md';

const AdminHeader = () => {
  return (
    <div style={{ height: '64px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #eef0f3' }}>
      
      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f5f9', padding: '8px 16px', borderRadius: '8px', width: '320px' }}>
        <MdSearch style={{ color: '#9093a3', marginRight: '8px', fontSize: '20px' }} />
        <input 
          type="text" 
          placeholder="Search system entities..." 
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#111322' }}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', cursor: 'pointer', color: '#5e6278', display: 'flex' }}>
          <MdNotificationsNone style={{ fontSize: '22px' }} />
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', backgroundColor: '#ff4d4f', borderRadius: '50%' }}></span>
        </div>
        <MdOutlineSettings style={{ fontSize: '22px', color: '#5e6278', cursor: 'pointer' }} />
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#111322', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          AD
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;