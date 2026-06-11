import React, { useState } from 'react';
import { Button, Switch, TimePicker, Typography, theme } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ServiceAvailability } from '../../../shared/types';

const { Text } = Typography;

export const DAYS = [
  { short: 'Sun', value: 0 }, { short: 'Mon', value: 1 }, { short: 'Tue', value: 2 },
  { short: 'Wed', value: 3 }, { short: 'Thu', value: 4 }, { short: 'Fri', value: 5 },
  { short: 'Sat', value: 6 },
];

interface AvailabilityEditorProps {
  value: ServiceAvailability[];
  onChange: (v: ServiceAvailability[]) => void;
}

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ value, onChange }) => {
  const { token } = theme.useToken();
  const [quickRange, setQuickRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs('08:00', 'HH:mm'), dayjs('17:00', 'HH:mm')]);

  const get = (d: number) => value.find(a => a.dayOfWeek === d);
  const toggle = (d: number, on: boolean) =>
    on ? onChange([...value, { dayOfWeek: d, startTime: quickRange[0].format('HH:mm'), endTime: quickRange[1].format('HH:mm') }])
       : onChange(value.filter(a => a.dayOfWeek !== d));
  const setT = (d: number, s: string, e: string) =>
    onChange(value.map(a => a.dayOfWeek === d ? { ...a, startTime: s, endTime: e } : a));

  const applyToDays = (days: number[]) =>
    onChange(days.map(d => ({ dayOfWeek: d, startTime: quickRange[0].format('HH:mm'), endTime: quickRange[1].format('HH:mm') })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Quick set — pick one range, fill every day in one click */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 12px', borderRadius: 10,
        background: token.colorPrimaryBg, border: `1px solid ${token.colorPrimaryBorder}`,
      }}>
        <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
        <Text style={{ fontSize: 12.5, fontWeight: 600, color: token.colorPrimary }}>Quick set</Text>
        <TimePicker.RangePicker
          format="HH:mm" size="small" allowClear={false} style={{ width: 170 }}
          value={quickRange}
          onChange={t => { if (t?.[0] && t?.[1]) setQuickRange([t[0], t[1]]); }}
        />
        <Button size="small" type="primary" onClick={() => applyToDays(DAYS.map(d => d.value))}>
          All days
        </Button>
        <Button size="small" onClick={() => applyToDays([1, 2, 3, 4, 5])}>
          Weekdays
        </Button>
        <div style={{ flex: 1 }} />
        <Button size="small" type="text" danger disabled={value.length === 0} onClick={() => onChange([])}>
          Clear all
        </Button>
      </div>

      {/* Per-day rows — fine-tune individual days after a quick set */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DAYS.map(({ short, value: d }) => {
          const entry = get(d); const on = !!entry;
          return (
            <div key={d} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '5px 12px',
              borderRadius: 8, minHeight: 40,
              background: on ? token.colorBgContainer : token.colorFillQuaternary,
              border: `1px solid ${on ? token.colorBorder : token.colorBorderSecondary}`,
            }}>
              <Switch size="small" checked={on} onChange={v => toggle(d, v)} />
              <Text style={{ width: 34, fontSize: 13, fontWeight: on ? 600 : 400, color: on ? token.colorText : token.colorTextTertiary }}>{short}</Text>
              {on
                ? <TimePicker.RangePicker format="HH:mm" size="small" allowClear={false} style={{ flex: 1, maxWidth: 220 }}
                    value={[dayjs(entry!.startTime, 'HH:mm'), dayjs(entry!.endTime, 'HH:mm')]}
                    onChange={t => { if (t?.[0] && t?.[1]) setT(d, t[0].format('HH:mm'), t[1].format('HH:mm')); }}
                  />
                : <Text type="secondary" style={{ fontSize: 12.5 }}>Closed</Text>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
};
