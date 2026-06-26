import { ConfigService } from '@nestjs/config';

export type AutomationDispatchPayload = {
  tenantId: string;
  formId: string;
  formTitle: string;
  responseId: string;
  fields: Array<{ id: string; type: string; label: string }>;
  answers: Array<{ fieldId: string; value: unknown }>;
  automation?: Record<string, unknown>;
};

export async function dispatchFormFlowAutomations(
  config: ConfigService,
  payload: AutomationDispatchPayload
): Promise<void> {
  const base = (config.get<string>('onlyflowBackendUrl') || '').replace(/\/$/, '');
  const key = config.get<string>('onlyflowInternalKey') || '';
  if (!base || !key) {
    console.warn('[FormFlow] Automações ignoradas: ONLYFLOW_BACKEND_URL ou ONLYFLOW_INTERNAL_KEY ausente');
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(`${base}/api/internal/formflow/run-automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onlyflow-internal-key': key,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(
        `[FormFlow] Automações rejeitadas (${res.status}) em ${base}/api/internal/formflow/run-automations`,
        body.slice(0, 500)
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[FormFlow] Falha ao disparar automações em ${base}`, message);
  }
}
