/*
 * DataPD 계정 데이터 동기화 — Supabase 테이블 (실모드 전용).
 * 스키마: supabase-schema.sql. 데모 모드에서는 DataPDAuth.supabase()가 null이라
 * 모든 함수가 조용히 no-op/로컬 폴백으로 동작합니다.
 */
(function () {
  function readJSON(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }

  function client() { return window.DataPDAuth ? DataPDAuth.supabase() : Promise.resolve(null); }
  function uid(c) { return c.auth.getUser().then(function (r) { return r.data.user ? r.data.user.id : null; }); }

  window.DataPDDB = {
    // 이 브라우저의 로컬 신청/학습 데이터를 계정으로 올림(unique 제약으로 중복 무시).
    syncUp: function () {
      return client().then(function (c) {
        if (!c) return null;
        return uid(c).then(function (id) {
          if (!id) return null;
          var rows = [];
          readJSON('doyou.apply.v1', []).forEach(function (a) {
            rows.push({ user_id: id, kind: 'invite', brand: a.brand || a.name, category: a.category,
              zone: a.zone, month: a.month, slot: a.slot, budget: Number(a.budget) || null,
              note: a.desc, fit_tier: a.fitTier, local_ts: a.ts });
          });
          readJSON('doyou.join.v1', []).forEach(function (j) {
            rows.push({ user_id: id, kind: 'franchise', brand: j.name, category: j.type,
              zone: j.area, budget: Number(j.budget) || null, note: j.memo, local_ts: j.ts });
          });
          var jobs = [];
          if (rows.length) jobs.push(c.from('applications').upsert(rows, { onConflict: 'user_id,kind,local_ts', ignoreDuplicates: true }));
          var st = readJSON('vocab_rush_stats', null);
          if (st) jobs.push(c.from('learning_stats').upsert({
            user_id: id, total_correct: st.totalCorrect || 0, total_games: st.totalGames || 0,
            best_streak: st.bestStreak || 0, total_score: st.totalScore || 0,
            achievements: (st.unlockedIds || []).length,
            streak_days: parseInt(localStorage.getItem('gx.streak') || '0', 10) || 0,
            updated_at: new Date().toISOString(),
          }));
          return Promise.all(jobs);
        });
      });
    },

    // 계정 데이터를 대시보드 공용 형태로 정규화해 반환({stats,streak,apps,joins}) 또는 null(데모/실패).
    load: function () {
      return client().then(function (c) {
        if (!c) return null;
        return Promise.all([
          c.from('applications').select('*').order('created_at', { ascending: false }),
          c.from('learning_stats').select('*').maybeSingle(),
        ]).then(function (res) {
          var apps = res[0].data || [], st = res[1].data || null;
          return {
            stats: st ? { totalCorrect: st.total_correct, totalGames: st.total_games,
              bestStreak: st.best_streak, totalScore: st.total_score,
              unlockedIds: new Array(st.achievements || 0) } : null,
            streak: st ? st.streak_days || 0 : 0,
            apps: apps.filter(function (r) { return r.kind === 'invite'; })
              .map(function (r) { return { brand: r.brand, category: r.category, zone: r.zone, fitTier: r.fit_tier, ts: r.local_ts || r.created_at }; }),
            joins: apps.filter(function (r) { return r.kind === 'franchise'; })
              .map(function (r) { return { name: r.brand, type: r.category, area: r.zone, ts: r.local_ts || r.created_at }; }),
          };
        });
      });
    },
  };
})();
