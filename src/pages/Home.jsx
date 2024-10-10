import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo');
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();

  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        const sortedLists = res.data.sort((a, b) =>
          a.title.localeCompare(b.title, 'ja')
        );
        setLists(sortedLists);
        if (sortedLists.length > 0) {
          setSelectListId(sortedLists[0].id);
        }
        console.log(
          'リストID:',
          sortedLists.map((list) => list.id)
        );
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, [cookies.token]);

  useEffect(() => {
    if (selectListId) {
      axios
        .get(`${url}/lists/${selectListId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [selectListId, cookies.token]);

  useEffect(() => {
    if (lists.length > 0) {
      // 初期フォーカスを最初のリストに設定
      document.querySelectorAll('.list-tab-item')[0].focus();
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
  };

  const handleKeyDown = (e, index) => {
    console.log('Key pressed:', e.key, 'Index:', index); // デバッグ用ログ
    let nextIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % lists.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + lists.length) % lists.length;
    }

    if (nextIndex !== undefined) {
      setSelectListId(lists[nextIndex].id);
      // 次のタブにフォーカスを移動
      document.querySelectorAll('.list-tab-item')[nextIndex].focus();
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" role="tablist">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => handleKeyDown(e, key)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            {selectListId && (
              <Tasks
                tasks={tasks}
                selectListId={selectListId}
                isDoneDisplay={isDoneDisplay}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateRemainingTime = (limit) => {
    const now = new Date();
    const deadline = new Date(limit);
    const diff = deadline - now;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const days = Math.floor(
      (diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24)
    );
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let remainingTime = '';
    if (years > 0) {
      remainingTime += `${years}年 `;
    }
    if (days > 0 || years > 0) {
      remainingTime += `${days}日 `;
    }
    remainingTime += `${hours}時間 ${minutes}分`;

    return remainingTime;
  };

  const filteredTasks = tasks
    .filter((task) => task.done === (isDoneDisplay === 'done'))
    .sort((a, b) => new Date(a.limit) - new Date(b.limit)); // 期限でソート

  return (
    <ul>
      {filteredTasks.map((task, key) => (
        <li key={key} className="task-item">
          <Link
            to={`/lists/${selectListId}/tasks/${task.id}`}
            className="task-item-link"
          >
            {task.title}
            <br />
            {task.done ? '完了' : '未完了'}
            <br />
            期限: {formatDate(task.limit)}
            <br />
            残り時間: {calculateRemainingTime(task.limit)}
          </Link>
        </li>
      ))}
    </ul>
  );
};

// prop-typesの定義を追加
Tasks.propTypes = {
  tasks: PropTypes.array.isRequired,
  selectListId: PropTypes.string.isRequired,
  isDoneDisplay: PropTypes.string.isRequired,
};

export default Home;
