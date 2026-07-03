-- Corrige todos os planos de cliente final para permitir somente 1 dispositivo.
UPDATE public.products_endcustomer
SET devices = 1,
    description = REPLACE(
      REPLACE(
        REPLACE(description, 'Até 2 dispositivos', 'Até 1 dispositivo'),
        'até 2 dispositivos',
        'até 1 dispositivo'
      ),
      '2 dispositivos',
      '1 dispositivo'
    )
WHERE slug IN ('try-7', 'ultra-15', 'ultra-30');
