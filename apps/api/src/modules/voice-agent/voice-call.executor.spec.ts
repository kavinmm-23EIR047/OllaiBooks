import { isInsideCallingWindow } from './voice-call.executor';

describe('voice calling window', () => {
  it('allows the inclusive start and blocks the exclusive end in tenant time', () => {
    expect(isInsideCallingWindow(new Date('2026-01-01T03:30:00.000Z'), 'Asia/Kolkata', '09:00', '19:00')).toBe(true);
    expect(isInsideCallingWindow(new Date('2026-01-01T13:30:00.000Z'), 'Asia/Kolkata', '09:00', '19:00')).toBe(false);
  });

  it('fails closed when the tenant time zone is invalid', () => {
    expect(isInsideCallingWindow(new Date(), 'Invalid/Zone', '09:00', '19:00')).toBe(false);
  });
});
