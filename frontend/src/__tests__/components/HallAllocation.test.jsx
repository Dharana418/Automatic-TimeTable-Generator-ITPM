import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HallAllocation from '../../components/HallAllocation.jsx';

vi.mock('../../components/HallResourcesPanel.jsx', () => ({
  default: () => <div data-testid="hall-resources-panel" />,
}));

vi.mock('../../components/HallRatingsPanel.jsx', () => ({
  default: () => <div data-testid="hall-ratings-panel" />,
}));

vi.mock('../../components/ActivityLogPanel.jsx', () => ({
  default: () => <div data-testid="activity-log-panel" />,
}));

vi.mock('../../components/SmartRecommendationsPanel.jsx', () => ({
  default: () => <div data-testid="smart-recommendations-panel" />,
}));

vi.mock('../../components/Building2DView.jsx', () => ({
  default: () => <div data-testid="building-2d-view" />,
}));

const createResponse = (data, ok = true, status = 200) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(data),
});

const mockInitialLoadSuccess = ({ halls = [], timetables = [] } = {}) => {
  global.fetch
    .mockResolvedValueOnce(createResponse({ success: true, items: halls }))
    .mockResolvedValueOnce(createResponse({ success: true, data: timetables }));
};

describe('HallAllocation component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads halls and timetables on mount', async () => {
    mockInitialLoadSuccess({
      halls: [
        {
          id: 'H101',
          name: 'H101',
          capacity: 120,
          features: { hallType: 'Lecture Hall', building: 'Main Building', floor: '1' },
        },
      ],
      timetables: [],
    });

    render(<HallAllocation apiBase="http://localhost:5000" />);

    expect(screen.getByText(/Loading Hall Allocation/i)).toBeInTheDocument();
    expect(await screen.findByText('H101')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5000/api/scheduler/halls',
      { credentials: 'include' }
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5000/api/academic-coordinator/timetables',
      { credentials: 'include' }
    );
  });

  it('shows toast error when halls API fails', async () => {
    global.fetch
      .mockResolvedValueOnce(createResponse({ error: 'Failed to load halls from API' }, false, 500))
      .mockResolvedValueOnce(createResponse({ data: [] }));

    render(<HallAllocation apiBase="http://localhost:5000" />);

    expect(await screen.findByText(/Failed to load halls from API/i)).toBeInTheDocument();
  });

  it('validates add hall form capacity', async () => {
    mockInitialLoadSuccess({ halls: [], timetables: [] });

    render(<HallAllocation apiBase="http://localhost:5000" />);

    await screen.findByText(/Hall Allocation/i);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /\+ Add Hall/i }));

    await user.type(screen.getByPlaceholderText(/e\.g\. H101/i), 'H202');
    await user.type(screen.getByPlaceholderText(/e\.g\. 100/i), '0');
    await user.type(screen.getByPlaceholderText(/e\.g\. Lecture Theatre/i), 'Lecture Hall');
    await user.type(screen.getByPlaceholderText(/e\.g\. Main Building/i), 'Main Building');

    await user.click(screen.getByRole('button', { name: /Save Hall/i }));

    expect(await screen.findByText(/Capacity must be an integer between 1 and 2000/i)).toBeInTheDocument();

    // Should not submit POST when client-side validation fails.
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('filters halls by search query', async () => {
    mockInitialLoadSuccess({
      halls: [
        {
          id: 'H101',
          name: 'H101',
          capacity: 120,
          features: { hallType: 'Lecture Hall', building: 'Main Building', floor: '1' },
        },
      ],
      timetables: [],
    });

    render(<HallAllocation apiBase="http://localhost:5000" />);

    await screen.findByText(/Hall Allocation/i);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/Search by ID, name, type, or building/i), 'ZZZ-NOT-EXIST');

    await waitFor(() => {
      expect(screen.getByText(/No halls match your search or filter criteria/i)).toBeInTheDocument();
    });
  });
});
