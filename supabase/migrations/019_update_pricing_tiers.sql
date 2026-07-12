-- Migration 019: Atualizar tabela de preços para revendedores
-- Remove faixas antigas (4 faixas, base R$30) e insere novas (9 faixas, base R$37,90)

DELETE FROM public.product_pricing;

INSERT INTO public.product_pricing (min_quantity, max_quantity, unit_price, discount_percent) VALUES
(1,   9,   37.90, 0),
(10,  19,  35.90, 5),
(20,  29,  33.90, 11),
(30,  39,  31.90, 16),
(40,  49,  29.90, 21),
(50,  74,  27.90, 26),
(75,  99,  25.90, 32),
(100, 149, 23.90, 37),
(150, NULL, 19.90, 47);
