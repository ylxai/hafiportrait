'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DataPoint {
  name: string
  value: number
  [key: string]: string | number
}

interface PieChartCardProps {
  title: string
  description?: string
  data: DataPoint[]
  colors?: string[]
  height?: number
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function PieChartCard({
  title,
  description,
  data,
  colors = DEFAULT_COLORS,
  height = 300,
}: PieChartCardProps) {
  const renderLabel = (props: any) => {
    const percent = props.percent ? (props.percent * 100).toFixed(0) : '0'
    return `${percent}%`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
