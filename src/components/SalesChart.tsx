import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesChartProps {
  data: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--muted-2)"
            tick={{ fill: 'var(--muted-2)', fontSize: 12 }}
          />
          <YAxis 
            stroke="var(--muted-2)"
            tick={{ fill: 'var(--muted-2)', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card-strong)', 
              border: '1px solid var(--line)',
              borderRadius: '8px',
              color: 'var(--text)'
            }}
            formatter={(value: any, name: any) => {
              if (name === 'revenue') return [`R$ ${value.toFixed(2)}`, 'Receita']
              return [value, 'Vendas']
            }}
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="var(--accent)" 
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="var(--cyan)" 
            strokeWidth={2}
            dot={{ fill: 'var(--cyan)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}