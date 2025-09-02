import { useState, useEffect } from "react";

export interface LeetCodeStats {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  acceptanceRate: number;
  ranking: number;
  // Raw calendar from API is a JSON string mapping epochSeconds -> count
  submissionCalendar?: string | Record<string, number>;
  // Derived counts (we compute client-side)
  recentSubmissions7?: number;
  recentSubmissions30?: number;
}

export const useLeetCodeStats = (username: string) => {
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://leetcode-stats-api.vercel.app/${username}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch LeetCode stats');
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error('User not found or invalid username');
        }
        
        // Normalize submissionCalendar and derive recent windows
        try {
          const nowMs = Date.now();
          const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
          const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

          let calendar: Record<string, number> | null = null;
          if (data.submissionCalendar) {
            if (typeof data.submissionCalendar === 'string') {
              try {
                calendar = JSON.parse(data.submissionCalendar);
              } catch {
                calendar = null;
              }
            } else if (typeof data.submissionCalendar === 'object') {
              calendar = data.submissionCalendar as Record<string, number>;
            }
          }

          let recent7 = 0;
          let recent30 = 0;
          if (calendar) {
            for (const [epochSecStr, count] of Object.entries(calendar)) {
              const tsMs = Number(epochSecStr) * 1000;
              if (!Number.isFinite(tsMs)) continue;
              if (tsMs >= sevenDaysAgoMs) recent7 += Number(count) || 0;
              if (tsMs >= thirtyDaysAgoMs) recent30 += Number(count) || 0;
            }
          }

          setStats({ ...data, recentSubmissions7: recent7, recentSubmissions30: recent30 });
        } catch {
          // If parsing fails, still set base data
          setStats(data);
        }
      } catch (err: any) {
        console.error('Error fetching LeetCode stats:', err);
        setError(err.message || 'Failed to fetch stats');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [username]);

  return { stats, loading, error };
};
