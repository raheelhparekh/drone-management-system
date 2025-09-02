import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { name, email, password } = formData;
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="card w-96 bg-base-100 shadow-xl border border-gray-200">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4 text-center w-full">Register</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                className="input input-bordered w-full"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                className="input input-bordered w-full"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                className="input input-bordered w-full"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>
          {error && <div role="alert" className="alert alert-error mt-4">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default Register;