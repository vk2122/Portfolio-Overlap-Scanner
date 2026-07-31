exports.setupPageMonitoring = (page) => {
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    // Exclude deliberate logs and generic browser 404 resource console logs
    if (text.includes('Failed to load resource') || text.includes('status of 404') || text.includes('favicon')) {
      return;
    }

    const isHydrationMismatch = text.toLowerCase().includes('hydration mismatch') || 
                                text.toLowerCase().includes('did not match server') || 
                                text.toLowerCase().includes('text content did not match');
    const isReactWarning = text.toLowerCase().includes('react-warning');

    if (msg.type() === 'error' || isHydrationMismatch || isReactWarning) {
      errors.push(`[Console Error/Warning] ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[Unhandled Exception] ${err.message}`);
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (!url.endsWith('.ico') && !url.includes('favicon') && !url.includes('hot-update')) {
      errors.push(`[Network Request Failed] ${url} - ${request.failure()?.errorText || 'Unknown error'}`);
    }
  });

  return {
    verifyNoErrors() {
      if (errors.length > 0) {
        throw new Error(`Quality Gate Failure - Hydration or runtime exceptions detected:\n` + errors.join('\n'));
      }
    }
  };
};
