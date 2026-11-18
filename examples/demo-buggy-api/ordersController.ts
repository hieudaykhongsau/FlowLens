// Demo buggy controller for FlowLens reproducible benchmark
// Scenario: POST /api/v1/orders fails with 403 Forbidden or ValidationError

export function registerOrderRoutes(router: any) {
  router.post('/api/v1/orders', async (req: any, res: any) => {
    const userRole = req.user?.role;
    if (userRole !== 'ROLE_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: requires ROLE_ADMIN' });
    }
    return res.status(201).json({ ok: true });
  });
}
