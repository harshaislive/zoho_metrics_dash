-- Project Completion Metrics Function
CREATE OR REPLACE FUNCTION get_project_completion_metrics(project_id text)
RETURNS TABLE (
  total_tasks bigint,
  completed_tasks bigint,
  completion_rate numeric,
  on_time_tasks bigint,
  timeliness_rate numeric,
  open_tasks_count bigint,
  not_started_tasks bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH project_tasks AS (
    SELECT 
      data->>'id' as task_id,
      data->>'completed' as completed,
      data->>'end_date' as due_date,
      data->>'completed_time' as completed_time,
      data->'status'->>'type' as status_type,
      data->>'percent_complete' as percent_complete
    FROM raw_zoho_data 
    WHERE entity_type = 'tasks'
    AND (project_id IS NULL OR data->'project'->>'id' = project_id)
  )
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN completed = 'true' THEN 1 END),
    ROUND((COUNT(CASE WHEN completed = 'true' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2),
    COUNT(CASE WHEN completed = 'true' AND completed_time <= due_date THEN 1 END),
    ROUND((COUNT(CASE WHEN completed = 'true' AND completed_time <= due_date THEN 1 END)::numeric / 
      NULLIF(COUNT(CASE WHEN completed = 'true' THEN 1 END), 0)::numeric) * 100, 2),
    COUNT(CASE WHEN completed = 'false' THEN 1 END),
    COUNT(CASE WHEN completed = 'false' AND percent_complete = '0' THEN 1 END)
  FROM project_tasks;
END;
$$ LANGUAGE plpgsql;

-- Project Aging Metrics Function
CREATE OR REPLACE FUNCTION get_project_aging_metrics(project_id text)
RETURNS TABLE (
  avg_aging_days numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH open_tasks AS (
    SELECT 
      EXTRACT(EPOCH FROM (NOW() - TO_TIMESTAMP(data->>'created_time', 'MM-DD-YYYY')))::numeric / 86400 as age_days
    FROM raw_zoho_data 
    WHERE entity_type = 'tasks'
    AND data->>'completed' = 'false'
    AND (project_id IS NULL OR data->'project'->>'id' = project_id)
  )
  SELECT ROUND(AVG(age_days), 2)
  FROM open_tasks;
END;
$$ LANGUAGE plpgsql; 