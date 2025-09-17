import { useState, useEffect } from 'react'
import { getAvailableTimeSlots } from '@/components/booking/api'
import type { AvailableTime } from '@/components/booking/types/index'

interface UseAvailableTimesProps {
  tenantId: string
  serviceId?: number
  date?: string
  timeFormat: '12hr' | '24hr'
  timezone?: string,
}

export const useAvailableTimes = ({ tenantId, serviceId, date, timeFormat, timezone }: UseAvailableTimesProps) => {
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([])
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)

  useEffect(() => {
    if (!serviceId || !date || !tenantId) {
      setAvailableTimes([])
      return
    }

    const fetchTimeSlots = async () => {
      setIsLoadingTimes(true)
      try {
        const response = await getAvailableTimeSlots(tenantId, serviceId, date, timeFormat, timezone)

        // ✅ Extract only slots here
        setAvailableTimes(response.data.data?.slots || [])
      } catch (error) {
        console.error('Failed to fetch available time slots:', error)
        setAvailableTimes([])
      } finally {
        setIsLoadingTimes(false)
      }
    }

    fetchTimeSlots()
  }, [serviceId, date, tenantId, timeFormat, timezone])

  return { availableTimes, isLoadingTimes }
}