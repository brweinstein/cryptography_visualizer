import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { Panel } from '../components/Panel';

function Wrapper() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Panel title="T" collapsible collapsed={collapsed} onToggle={() => setCollapsed(v=>!v)}>
      <div>content</div>
    </Panel>
  );
}

describe('Panel collapsible', () => {
  it('toggles content visibility', async () => {
    render(<Wrapper />);
    // content visible initially
    expect(screen.getByText('content')).toBeInTheDocument();
    // click Hide
    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByText('content')).not.toBeInTheDocument();
    // click Show
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
