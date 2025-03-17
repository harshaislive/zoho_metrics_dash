create or replace function public.get_project_metrics(p_project_id uuid)
returns table (
  total_tasks bigint,
  completed_tasks bigint,
  on_time_completed_tasks bigint,
  open_tasks bigint,
  overdue_tasks bigint,
  average_aging_days numeric
) as $$
select
  count(id) as total_tasks,
  count(id) filter (where status = 'Completed') as completed_tasks,
  count(id) filter (where status = 'Completed' and completed_time <= due_date) as on_time_completed_tasks,
  count(id) filter (where status = 'Open' and due_date > now()) as open_tasks,
  count(id) filter (where status = 'Open' and due_date <= now()) as overdue_tasks,
  coalesce(avg(extract(epoch from (now() - created_time))/86400), 0)::numeric(10,1) as average_aging_days
from public.tasks
where project_id = p_project_id;
$$ language sql stable; 