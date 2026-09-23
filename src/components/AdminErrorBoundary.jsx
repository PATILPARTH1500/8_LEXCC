import React from 'react';
import { Link } from 'react-router-dom';

class AdminErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Admin Panel render error:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ padding: '32px', color: '#fff', background: '#111' }}>
        <p>Something went wrong in the Admin Panel.</p>
        <button type="button" onClick={() => this.setState({ failed: false })}>Try again</button>
        <Link to="/account/admin" style={{ marginLeft: '16px', color: '#D4AF37' }}>Back to admin overview</Link>
      </div>
    );
  }
}

export default AdminErrorBoundary;
